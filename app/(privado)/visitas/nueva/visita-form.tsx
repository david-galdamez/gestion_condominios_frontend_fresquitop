"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  crearVisita,
  editarVisita,
  type CrearVisitaState,
} from "@/app/actions/visitas";
import { CopiarBoton } from "@/components/copiar-boton";
import { formatFecha } from "@/lib/format";
import type { Autorizacion, UnidadMia } from "@/lib/types/visitas";
import {
  mascaraDui,
  validarDocumento,
  validarFecha,
  validarHora,
  validarNombre,
  validarPlaca,
  validarVisita,
  type CamposVisita,
  type ErroresVisita,
} from "@/lib/validaciones/visita";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100";
const btnPrimario =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60";

const inicial: CrearVisitaState = { status: "idle" };

type Props = {
  unidades: UnidadMia[];
  hoy: string;
  maxFecha: string;
  // H07b: si viene, el formulario edita esa autorización (la unidad es fija).
  autorizacion?: Autorizacion;
};

// Envoltorio: "Autorizar otra visita" cambia la key y reinicia todo el estado
// (campos y resultado de la acción) sin recargar la página.
export function VisitaForm(props: Props) {
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
  unidades,
  hoy,
  maxFecha,
  autorizacion,
  onOtra,
}: Props & { onOtra: () => void }) {
  const editando = Boolean(autorizacion);
  const [state, formAction, pending] = useActionState(
    autorizacion
      ? editarVisita.bind(null, autorizacion.id, autorizacion.codigo)
      : crearVisita,
    inicial,
  );
  // Campos controlados: React 19 reinicia los no controlados tras una acción,
  // y el usuario perdería lo escrito si el servidor devuelve un error.
  const [campos, setCampos] = useState<CamposVisita>(
    autorizacion
      ? {
          unidadId: autorizacion.unidad.id,
          nombre: autorizacion.nombre,
          tipoDocumento: autorizacion.tipoDocumento,
          numeroDocumento: autorizacion.numeroDocumento,
          placa: autorizacion.placa ?? "",
          fechaVisita: autorizacion.fechaVisita,
          horaEstimada: autorizacion.horaEstimada,
        }
      : {
          unidadId: unidades.length === 1 ? unidades[0].id : "",
          nombre: "",
          tipoDocumento: "DUI",
          numeroDocumento: "",
          placa: "",
          fechaVisita: "",
          horaEstimada: "",
        },
  );
  const [errCliente, setErrCliente] = useState<ErroresVisita>({});

  if (state.status === "ok" && state.autorizacion) {
    const a = state.autorizacion;
    return (
      <section
        aria-label="Código de la visita"
        className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-zinc-200 p-6 text-center dark:border-zinc-800"
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {editando
            ? "Cambios guardados. Código de la visita:"
            : "Visita autorizada. Comparte este código con tu visitante:"}
        </p>
        <p
          data-testid="codigo"
          className="font-mono text-5xl font-semibold tracking-widest"
        >
          {a.codigo.slice(0, 3)} {a.codigo.slice(3)}
        </p>
        <CopiarBoton texto={a.codigo} />
        <p>Válido solo el {formatFecha(a.fechaVisita)}</p>
        {state.codigoNuevo && (
          <p role="status" className="text-sm font-medium">
            Cambiaste la fecha: se generó un código nuevo y el anterior dejó de
            funcionar.
          </p>
        )}
        <dl className="text-sm text-zinc-600 dark:text-zinc-400">
          <div>Visitante: {a.nombre}</div>
          <div>Unidad {a.unidad.codigo}</div>
          <div>Hora estimada: {a.horaEstimada}</div>
        </dl>
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href="/visitas"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
          >
            Ver mis visitas
          </Link>
          {!editando && (
            <button type="button" onClick={onOtra} className={btnPrimario}>
              Autorizar otra visita
            </button>
          )}
        </div>
      </section>
    );
  }

  // Los errores del cliente (más recientes) tienen prioridad sobre los del servidor.
  const errores: ErroresVisita = { ...state.errores, ...errCliente };

  function set<K extends keyof CamposVisita>(k: K, v: CamposVisita[K]) {
    setCampos((c) => ({ ...c, [k]: v }));
    // Al editar un campo se descarta su error hasta el próximo blur/envío.
    setErrCliente((e) => ({ ...e, [k]: undefined }));
  }

  function blur(k: keyof CamposVisita, error: string | undefined) {
    setErrCliente((e) => ({ ...e, [k]: error }));
  }

  function cambiarTipo(tipo: string) {
    // La máscara de un tipo no sirve para el otro: se limpia el número.
    setCampos((c) => ({ ...c, tipoDocumento: tipo, numeroDocumento: "" }));
    setErrCliente((e) => ({ ...e, numeroDocumento: undefined }));
  }

  function cambiarNumero(v: string) {
    set(
      "numeroDocumento",
      campos.tipoDocumento === "DUI" ? mascaraDui(v) : v.toUpperCase(),
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const errs = validarVisita(campos, hoy);
    setErrCliente(errs);
    if (Object.keys(errs).length > 0) e.preventDefault();
  }

  const campo = (
    k: keyof CamposVisita,
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

  const ariaDe = (k: keyof CamposVisita) => ({
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

      {!editando && unidades.length > 1 ? (
        campo(
          "unidadId",
          "Unidad",
          <select
            id="unidadId"
            name="unidadId"
            value={campos.unidadId}
            onChange={(e) => set("unidadId", e.target.value)}
            className={inputClass}
            {...ariaDe("unidadId")}
          >
            <option value="">Selecciona una unidad</option>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.codigo}
              </option>
            ))}
          </select>,
        )
      ) : (
        <>
          <p className="text-zinc-600 dark:text-zinc-400">
            Unidad {autorizacion?.unidad.codigo ?? unidades[0].codigo}
          </p>
          <input type="hidden" name="unidadId" value={campos.unidadId} />
        </>
      )}

      {campo(
        "nombre",
        "Nombre del visitante",
        <input
          id="nombre"
          name="nombre"
          type="text"
          autoComplete="off"
          value={campos.nombre}
          onChange={(e) => set("nombre", e.target.value)}
          onBlur={() => blur("nombre", validarNombre(campos.nombre))}
          className={inputClass}
          {...ariaDe("nombre")}
        />,
      )}

      {campo(
        "tipoDocumento",
        "Tipo de documento",
        <select
          id="tipoDocumento"
          name="tipoDocumento"
          value={campos.tipoDocumento}
          onChange={(e) => cambiarTipo(e.target.value)}
          className={inputClass}
        >
          <option value="DUI">DUI</option>
          <option value="PASAPORTE">Pasaporte</option>
        </select>,
      )}

      {campo(
        "numeroDocumento",
        "Número de documento",
        <input
          id="numeroDocumento"
          name="numeroDocumento"
          type="text"
          autoComplete="off"
          placeholder={campos.tipoDocumento === "DUI" ? "12345678-9" : ""}
          value={campos.numeroDocumento}
          onChange={(e) => cambiarNumero(e.target.value)}
          onBlur={() =>
            blur(
              "numeroDocumento",
              validarDocumento(campos.tipoDocumento, campos.numeroDocumento),
            )
          }
          className={inputClass}
          {...ariaDe("numeroDocumento")}
        />,
      )}

      {campo(
        "placa",
        "Placa (opcional)",
        <input
          id="placa"
          name="placa"
          type="text"
          autoComplete="off"
          value={campos.placa}
          onChange={(e) => set("placa", e.target.value.toUpperCase())}
          onBlur={() => blur("placa", validarPlaca(campos.placa))}
          className={inputClass}
          {...ariaDe("placa")}
        />,
      )}

      {campo(
        "fechaVisita",
        "Fecha de visita",
        <input
          id="fechaVisita"
          name="fechaVisita"
          type="date"
          min={hoy}
          max={maxFecha}
          value={campos.fechaVisita}
          onChange={(e) => set("fechaVisita", e.target.value)}
          onBlur={() => blur("fechaVisita", validarFecha(campos.fechaVisita, hoy))}
          className={inputClass}
          {...ariaDe("fechaVisita")}
        />,
      )}

      {campo(
        "horaEstimada",
        "Hora estimada",
        <input
          id="horaEstimada"
          name="horaEstimada"
          type="time"
          value={campos.horaEstimada}
          onChange={(e) => set("horaEstimada", e.target.value)}
          onBlur={() => blur("horaEstimada", validarHora(campos.horaEstimada))}
          className={inputClass}
          {...ariaDe("horaEstimada")}
        />,
      )}

      <div>
        <button type="submit" disabled={pending} className={btnPrimario}>
          {editando ? "Guardar cambios" : "Autorizar visita"}
        </button>
      </div>
    </form>
  );
}
