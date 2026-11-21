"use client";

import { useActionState, useState } from "react";
import { crearNuevaUnidad, type CrearUnidadState } from "@/app/actions/unidades";
import type { Torre } from "@/lib/types/usuarios";
import {
  validarCodigo,
  validarTorre,
  validarUnidad,
  type CamposUnidad,
  type ErroresUnidad,
} from "@/lib/validaciones/unidad";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100";
const btnPrimario =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60";

const inicial: CrearUnidadState = { status: "idle" };

export function UnidadForm({ torres }: { torres: Torre[] }) {
  const [state, formAction, pending] = useActionState(crearNuevaUnidad, inicial);
  const [campos, setCampos] = useState<CamposUnidad>({ torreId: "", codigo: "" });
  const [errCliente, setErrCliente] = useState<ErroresUnidad>({});
  const errores: ErroresUnidad = { ...state.errores, ...errCliente };

  function set<K extends keyof CamposUnidad>(k: K, v: string) {
    setCampos((c) => ({ ...c, [k]: v }));
    setErrCliente((e) => ({ ...e, [k]: undefined }));
  }
  const blur = (k: keyof CamposUnidad, error: string | undefined) =>
    setErrCliente((e) => ({ ...e, [k]: error }));

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const errs = validarUnidad(campos);
    setErrCliente(errs);
    if (Object.keys(errs).length > 0) e.preventDefault();
  }

  const ariaDe = (k: keyof CamposUnidad) => ({
    "aria-invalid": errores[k] ? true : undefined,
    "aria-describedby": errores[k] ? `${k}-error` : undefined,
  });
  const error = (k: keyof CamposUnidad) =>
    errores[k] && (
      <p id={`${k}-error`} className="text-sm text-red-600">
        {errores[k]}
      </p>
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

      <div className="flex flex-col gap-1">
        <label htmlFor="torreId" className="text-sm font-medium">
          Torre
        </label>
        <select
          id="torreId"
          name="torreId"
          value={campos.torreId}
          onChange={(e) => set("torreId", e.target.value)}
          onBlur={() => blur("torreId", validarTorre(campos.torreId))}
          className={inputClass}
          {...ariaDe("torreId")}
        >
          <option value="">Selecciona una torre</option>
          {torres.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
        {error("torreId")}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="codigo" className="text-sm font-medium">
          Código de la unidad
        </label>
        <input
          id="codigo"
          name="codigo"
          type="text"
          autoComplete="off"
          maxLength={20}
          placeholder="A-101"
          value={campos.codigo}
          onChange={(e) => set("codigo", e.target.value)}
          onBlur={() => blur("codigo", validarCodigo(campos.codigo))}
          className={inputClass}
          {...ariaDe("codigo")}
        />
        {error("codigo")}
      </div>

      <div>
        <button type="submit" disabled={pending} className={btnPrimario}>
          {pending ? "Guardando..." : "Registrar unidad"}
        </button>
      </div>
    </form>
  );
}
