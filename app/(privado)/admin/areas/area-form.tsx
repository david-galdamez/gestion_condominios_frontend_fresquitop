"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { guardarArea, type GuardarAreaState } from "@/app/actions/areas";
import type { Area } from "@/lib/types/areas";
import {
  DURACION_DEFAULT,
  DURACIONES,
  HORAS,
  validarArea,
  validarCapacidad,
  validarCierre,
  validarNombre,
  type CamposArea,
  type ErroresArea,
} from "@/lib/validaciones/area";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100";
const btnPrimario =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60";

const inicial: GuardarAreaState = { status: "idle" };

// Sin `area` es el alta; con `area` es la edición (manda su id oculto).
export function AreaForm({ area }: { area?: Area }) {
  const [state, formAction, pending] = useActionState(guardarArea, inicial);
  // Campos controlados: React 19 reinicia los no controlados tras una acción,
  // y el usuario perdería lo escrito si el servidor devuelve un error.
  const [campos, setCampos] = useState<CamposArea>({
    nombre: area?.nombre ?? "",
    capacidad: area ? String(area.capacidad) : "",
    horaApertura: area?.horaApertura ?? "08:00",
    horaCierre: area?.horaCierre ?? "20:00",
    duracionMaxHoras: String(area?.duracionMaxHoras ?? DURACION_DEFAULT),
  });
  const [errCliente, setErrCliente] = useState<ErroresArea>({});

  // Los errores del cliente (más recientes) tienen prioridad sobre los del servidor.
  const errores: ErroresArea = { ...state.errores, ...errCliente };

  function set<K extends keyof CamposArea>(k: K, v: CamposArea[K]) {
    setCampos((c) => ({ ...c, [k]: v }));
    // Al editar un campo se descarta su error hasta el próximo blur/envío.
    setErrCliente((e) => ({ ...e, [k]: undefined }));
  }

  function blur(k: keyof CamposArea, error: string | undefined) {
    setErrCliente((e) => ({ ...e, [k]: error }));
  }

  // Cambiar una hora revalida el par: el error de horario va bajo el cierre.
  function cambiarHora(k: "horaApertura" | "horaCierre", v: string) {
    const nuevos = { ...campos, [k]: v };
    setCampos(nuevos);
    setErrCliente((e) => ({
      ...e,
      horaApertura: undefined,
      horaCierre: validarCierre(nuevos.horaApertura, nuevos.horaCierre),
    }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const errs = validarArea(campos);
    setErrCliente(errs);
    if (Object.keys(errs).length > 0) e.preventDefault();
  }

  const campo = (
    k: keyof CamposArea,
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

  const ariaDe = (k: keyof CamposArea) => ({
    "aria-invalid": errores[k] ? true : undefined,
    "aria-describedby": errores[k] ? `${k}-error` : undefined,
  });

  return (
    <form
      action={formAction}
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

      {area && <input type="hidden" name="id" value={area.id} />}

      {campo(
        "nombre",
        "Nombre",
        <input
          id="nombre"
          name="nombre"
          type="text"
          autoComplete="off"
          maxLength={40}
          placeholder="Salón de eventos"
          value={campos.nombre}
          onChange={(e) => set("nombre", e.target.value)}
          onBlur={() => blur("nombre", validarNombre(campos.nombre))}
          className={inputClass}
          {...ariaDe("nombre")}
        />,
      )}

      {campo(
        "capacidad",
        "Capacidad (personas)",
        <input
          id="capacidad"
          name="capacidad"
          type="number"
          inputMode="numeric"
          min={1}
          max={200}
          step={1}
          value={campos.capacidad}
          onChange={(e) => set("capacidad", e.target.value)}
          onBlur={() => blur("capacidad", validarCapacidad(campos.capacidad))}
          className={inputClass}
          {...ariaDe("capacidad")}
        />,
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {campo(
          "horaApertura",
          "Hora de apertura",
          <select
            id="horaApertura"
            name="horaApertura"
            value={campos.horaApertura}
            onChange={(e) => cambiarHora("horaApertura", e.target.value)}
            className={inputClass}
            {...ariaDe("horaApertura")}
          >
            {HORAS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>,
        )}

        {campo(
          "horaCierre",
          "Hora de cierre",
          <select
            id="horaCierre"
            name="horaCierre"
            value={campos.horaCierre}
            onChange={(e) => cambiarHora("horaCierre", e.target.value)}
            className={inputClass}
            {...ariaDe("horaCierre")}
          >
            {HORAS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>,
        )}
      </div>

      {campo(
        "duracionMaxHoras",
        "Duración máxima por reserva",
        <select
          id="duracionMaxHoras"
          name="duracionMaxHoras"
          value={campos.duracionMaxHoras}
          onChange={(e) => set("duracionMaxHoras", e.target.value)}
          className={inputClass}
          {...ariaDe("duracionMaxHoras")}
        >
          {DURACIONES.map((d) => (
            <option key={d} value={String(d)}>
              {d} {d === 1 ? "hora" : "horas"}
            </option>
          ))}
        </select>,
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={btnPrimario}>
          {pending ? "Guardando..." : "Guardar"}
        </button>
        <Link
          href="/admin/areas"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
