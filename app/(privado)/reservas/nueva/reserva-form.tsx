"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import {
  crearReservaAction,
  type CrearReservaState,
} from "@/app/actions/reservas";
import { CopiarBoton } from "@/components/copiar-boton";
import { formatFecha } from "@/lib/format";
import type { Area } from "@/lib/types/areas";
import {
  horasDelArea,
  validarReserva,
  type Ahora,
  type CamposReserva,
  type ErroresReserva,
} from "@/lib/validaciones/reserva";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100";
const btnPrimario =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60";

const inicial: CrearReservaState = { status: "idle" };

type Props = { areas: Area[]; ahora: Ahora };

// Envoltorio: "Hacer otra reserva" cambia la key y reinicia todo el estado
// (campos y resultado de la acción) sin recargar la página.
export function ReservaForm(props: Props) {
  const [intento, setIntento] = useState(0);
  return (
    <Formulario
      key={intento}
      {...props}
      onOtra={() => setIntento((n) => n + 1)}
    />
  );
}

function Formulario({
  areas,
  ahora,
  onOtra,
}: Props & { onOtra: () => void }) {
  const [state, formAction, pending] = useActionState(
    crearReservaAction,
    inicial,
  );
  // Campos controlados: React 19 reinicia los no controlados tras una acción,
  // y el usuario perdería lo escrito si el servidor devuelve un error.
  const [campos, setCampos] = useState<CamposReserva>({
    areaId: areas.length === 1 ? areas[0].id : "",
    fecha: "",
    horaInicio: "",
    horaFin: "",
    asistentes: "",
  });
  const [errCliente, setErrCliente] = useState<ErroresReserva>({});

  if (state.status === "ok" && state.reserva) {
    const r = state.reserva;
    return (
      <section
        aria-label="Reserva confirmada"
        className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-zinc-200 p-6 text-center dark:border-zinc-800"
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Reserva confirmada. Tu código es:
        </p>
        <p
          data-testid="codigo"
          className="font-mono text-4xl font-semibold tracking-wider"
        >
          {r.codigo}
        </p>
        <CopiarBoton texto={r.codigo} />
        <dl className="text-sm text-zinc-600 dark:text-zinc-400">
          <div>{r.area}</div>
          <div>{formatFecha(r.fecha)}</div>
          <div>
            De {r.horaInicio} a {r.horaFin}
          </div>
          <div>{r.asistentes} asistentes</div>
        </dl>
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href="/reservas"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
          >
            Ver mis reservas
          </Link>
          <button type="button" onClick={onOtra} className={btnPrimario}>
            Hacer otra reserva
          </button>
        </div>
      </section>
    );
  }

  const area = areas.find((a) => a.id === campos.areaId);
  const horas = area ? horasDelArea(area) : { inicios: [], fines: [] };

  // Los errores del cliente (más recientes) tienen prioridad sobre los del servidor.
  const errores: ErroresReserva = { ...state.errores, ...errCliente };

  function set<K extends keyof CamposReserva>(k: K, v: CamposReserva[K]) {
    setCampos((c) => ({ ...c, [k]: v }));
    // Al editar un campo se descarta su error hasta el próximo envío.
    setErrCliente((e) => ({ ...e, [k]: undefined }));
  }

  function cambiarArea(id: string) {
    // El horario válido depende del área: se limpian las horas elegidas.
    setCampos((c) => ({ ...c, areaId: id, horaInicio: "", horaFin: "" }));
    setErrCliente((e) => ({
      ...e,
      areaId: undefined,
      horaInicio: undefined,
      horaFin: undefined,
      asistentes: undefined,
    }));
  }

  // Se envía con startTransition y no con action={...}: React 19 reinicia el
  // formulario al terminar una acción y los selects perderían lo elegido si el
  // servidor devuelve un error.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validarReserva(campos, area, ahora);
    setErrCliente(errs);
    if (Object.keys(errs).length > 0) return;
    const datos = new FormData(e.currentTarget);
    startTransition(() => formAction(datos));
  }

  const campo = (
    k: keyof CamposReserva,
    label: string,
    control: React.ReactNode,
  ) => (
    <div className="flex flex-col gap-1">
      <label htmlFor={k} className="text-sm font-medium">
        {label}
      </label>
      {control}
      {errores[k] && (
        <p id={`${k}-error`} className="text-sm text-red-600">
          {errores[k]}
        </p>
      )}
    </div>
  );

  const ariaDe = (k: keyof CamposReserva) => ({
    "aria-invalid": errores[k] ? true : undefined,
    "aria-describedby": errores[k] ? `${k}-error` : undefined,
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex max-w-xl flex-col gap-4"
    >
      {state.mensajes && state.mensajes.length > 0 && (
        <div role="alert" className="text-sm text-red-600">
          {state.mensajes.map((m) => (
            <p key={m}>{m}</p>
          ))}
        </div>
      )}

      {campo(
        "areaId",
        "Área",
        <select
          id="areaId"
          name="areaId"
          value={campos.areaId}
          onChange={(e) => cambiarArea(e.target.value)}
          className={inputClass}
          {...ariaDe("areaId")}
        >
          <option value="">Selecciona un área</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>,
      )}

      {area && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Horario {area.horaApertura} – {area.horaCierre} · máximo{" "}
          {area.duracionMaxHoras} {area.duracionMaxHoras === 1 ? "hora" : "horas"}{" "}
          · capacidad {area.capacidad}{" "}
          {area.capacidad === 1 ? "persona" : "personas"}
        </p>
      )}

      {campo(
        "fecha",
        "Fecha",
        <input
          id="fecha"
          name="fecha"
          type="date"
          min={ahora.hoy}
          value={campos.fecha}
          onChange={(e) => set("fecha", e.target.value)}
          className={inputClass}
          {...ariaDe("fecha")}
        />,
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {campo(
          "horaInicio",
          "Hora de inicio",
          <select
            id="horaInicio"
            name="horaInicio"
            value={campos.horaInicio}
            disabled={!area}
            onChange={(e) => set("horaInicio", e.target.value)}
            className={inputClass}
            {...ariaDe("horaInicio")}
          >
            <option value="">Elige la hora</option>
            {horas.inicios.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>,
        )}
        {campo(
          "horaFin",
          "Hora de fin",
          <select
            id="horaFin"
            name="horaFin"
            value={campos.horaFin}
            disabled={!area}
            onChange={(e) => set("horaFin", e.target.value)}
            className={inputClass}
            {...ariaDe("horaFin")}
          >
            <option value="">Elige la hora</option>
            {horas.fines.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>,
        )}
      </div>

      {campo(
        "asistentes",
        "Número de asistentes",
        <input
          id="asistentes"
          name="asistentes"
          type="number"
          inputMode="numeric"
          min={1}
          max={area?.capacidad}
          value={campos.asistentes}
          onChange={(e) => set("asistentes", e.target.value)}
          className={inputClass}
          {...ariaDe("asistentes")}
        />,
      )}

      <div>
        <button type="submit" disabled={pending} className={btnPrimario}>
          {pending ? "Reservando..." : "Reservar"}
        </button>
      </div>
    </form>
  );
}
