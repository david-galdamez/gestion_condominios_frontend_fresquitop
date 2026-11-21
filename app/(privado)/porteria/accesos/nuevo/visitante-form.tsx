"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  registrarEntradaSinCodigoAction,
  type EntradaSinCodigoState,
} from "@/app/actions/accesos";
import type { UnidadResumen } from "@/lib/types/paquetes";
import {
  validarMotivo,
  validarVisitante,
  type CamposVisitante,
  type ErroresVisitante,
} from "@/lib/validaciones/acceso";
import { validarDocumento, validarNombre } from "@/lib/validaciones/visita";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100";
const btnPrimario =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60";

const inicial: EntradaSinCodigoState = { status: "idle" };

// FE-8.2: registro de un visitante sin pre-autorización.
export function VisitanteForm({ unidades }: { unidades: UnidadResumen[] }) {
  const [state, formAction, pending] = useActionState(
    registrarEntradaSinCodigoAction,
    inicial,
  );
  // Campos controlados: React 19 reinicia los no controlados tras una acción.
  const [campos, setCampos] = useState<CamposVisitante>({
    nombre: "",
    tipoDocumento: "DUI",
    numeroDocumento: "",
    unidadId: "",
    motivo: "",
  });
  const [errCliente, setErrCliente] = useState<ErroresVisitante>({});
  const errores: ErroresVisitante = { ...state.errores, ...errCliente };

  function set<K extends keyof CamposVisitante>(k: K, v: string) {
    setCampos((c) => ({ ...c, [k]: v }));
    setErrCliente((e) => ({ ...e, [k]: undefined }));
  }

  const blur = (k: keyof CamposVisitante, error: string | undefined) =>
    setErrCliente((e) => ({ ...e, [k]: error }));

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const errs = validarVisitante(campos);
    setErrCliente(errs);
    if (Object.keys(errs).length > 0) e.preventDefault();
  }

  const ariaDe = (k: keyof CamposVisitante) => ({
    "aria-invalid": errores[k] ? true : undefined,
    "aria-describedby": errores[k] ? `${k}-error` : undefined,
  });

  const campo = (
    k: keyof CamposVisitante,
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

      {campo(
        "nombre",
        "Nombre completo",
        <input
          id="nombre"
          name="nombre"
          type="text"
          autoComplete="off"
          maxLength={60}
          value={campos.nombre}
          onChange={(e) => set("nombre", e.target.value)}
          onBlur={() => blur("nombre", validarNombre(campos.nombre))}
          className={inputClass}
          {...ariaDe("nombre")}
        />,
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[10rem_1fr]">
        {campo(
          "tipoDocumento",
          "Documento",
          <select
            id="tipoDocumento"
            name="tipoDocumento"
            value={campos.tipoDocumento}
            onChange={(e) => set("tipoDocumento", e.target.value)}
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
            maxLength={12}
            placeholder={campos.tipoDocumento === "DUI" ? "01234567-8" : "AB1234567"}
            value={campos.numeroDocumento}
            onChange={(e) => set("numeroDocumento", e.target.value)}
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
      </div>

      {campo(
        "unidadId",
        "Unidad visitada",
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
      )}

      {campo(
        "motivo",
        "Motivo de la visita",
        <textarea
          id="motivo"
          name="motivo"
          rows={2}
          maxLength={100}
          value={campos.motivo}
          onChange={(e) => set("motivo", e.target.value)}
          onBlur={() => blur("motivo", validarMotivo(campos.motivo))}
          className={inputClass}
          {...ariaDe("motivo")}
        />,
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={btnPrimario}>
          {pending ? "Registrando..." : "Registrar entrada"}
        </button>
        <Link
          href="/porteria/accesos"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
