"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import {
  publicarComunicado,
  type PublicarComunicadoState,
} from "@/app/actions/comunicados";
import type { Torre } from "@/lib/types/comunicados";
import {
  CATEGORIAS,
  validarComunicado,
  type CamposComunicado,
  type ErroresComunicado,
} from "@/lib/validaciones/comunicado";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100";
const btnPrimario =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60";
const btnSecundario =
  "rounded-md border border-zinc-300 px-4 py-2 text-sm disabled:opacity-60 dark:border-zinc-700";

const inicial: PublicarComunicadoState = { status: "idle" };

// `ahora` llega del servidor ("YYYY-MM-DDTHH:mm", hora de El Salvador).
export function ComunicadoForm({
  torres,
  ahora,
}: {
  torres: Torre[];
  ahora: string;
}) {
  const [state, formAction, pending] = useActionState(
    publicarComunicado,
    inicial,
  );
  const [campos, setCampos] = useState<CamposComunicado>({
    titulo: "",
    contenido: "",
    categoria: "",
    destino: "todos",
    torreIds: [],
    fechaPublicacion: ahora,
    fechaExpiracion: "",
  });
  const [errCliente, setErrCliente] = useState<ErroresComunicado>({});
  const [confirmar, setConfirmar] = useState(false);
  // Se pone en true justo antes de reenviar desde el diálogo.
  const confirmado = useRef(false);

  const errores: ErroresComunicado = { ...state.errores, ...errCliente };
  const programar = campos.fechaPublicacion > ahora;
  const nTorres =
    campos.destino === "todos" ? torres.length : campos.torreIds.length;

  function set<K extends keyof CamposComunicado>(
    k: K,
    v: CamposComunicado[K],
  ) {
    setCampos((c) => ({ ...c, [k]: v }));
    if (k !== "torreIds") setErrCliente((e) => ({ ...e, [k]: undefined }));
  }

  function alternarTorre(id: string) {
    setCampos((c) => ({
      ...c,
      torreIds: c.torreIds.includes(id)
        ? c.torreIds.filter((t) => t !== id)
        : [...c.torreIds, id],
    }));
    setErrCliente((e) => ({ ...e, destino: undefined }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (confirmado.current) {
      confirmado.current = false;
      setConfirmar(false);
      return;
    }
    e.preventDefault();
    const errs = validarComunicado(campos);
    setErrCliente(errs);
    if (Object.keys(errs).length === 0) setConfirmar(true);
  }

  const error = (k: keyof ErroresComunicado) =>
    errores[k] && (
      <p id={`${k}-error`} className="text-sm text-red-600">
        {errores[k]}
      </p>
    );
  const ariaDe = (k: keyof ErroresComunicado) => ({
    "aria-invalid": errores[k] ? true : undefined,
    "aria-describedby": errores[k] ? `${k}-error` : undefined,
  });

  return (
    <form
      action={formAction}
      onSubmit={onSubmit}
      noValidate
      className="flex max-w-2xl flex-col gap-4"
    >
      {state.mensajes && state.mensajes.length > 0 && (
        <div role="alert" className="text-sm text-red-600">
          {state.mensajes.map((m) => (
            <p key={m}>{m}</p>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="titulo" className="text-sm font-medium">
          Título
        </label>
        <input
          id="titulo"
          name="titulo"
          maxLength={100}
          value={campos.titulo}
          onChange={(e) => set("titulo", e.target.value)}
          className={inputClass}
          {...ariaDe("titulo")}
        />
        {error("titulo")}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="contenido" className="text-sm font-medium">
          Contenido
        </label>
        <textarea
          id="contenido"
          name="contenido"
          rows={6}
          maxLength={2000}
          value={campos.contenido}
          onChange={(e) => set("contenido", e.target.value)}
          className={inputClass}
          {...ariaDe("contenido")}
        />
        <p className="text-right text-xs text-zinc-500" aria-live="polite">
          {campos.contenido.length}/2000
        </p>
        {error("contenido")}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="categoria" className="text-sm font-medium">
          Categoría
        </label>
        <select
          id="categoria"
          name="categoria"
          value={campos.categoria}
          onChange={(e) => set("categoria", e.target.value)}
          className={inputClass}
          {...ariaDe("categoria")}
        >
          <option value="">Elige una categoría</option>
          {CATEGORIAS.map((c) => (
            <option key={c.valor} value={c.valor}>
              {c.etiqueta}
            </option>
          ))}
        </select>
        {error("categoria")}
      </div>

      <fieldset className="flex flex-col gap-2" {...ariaDe("destino")}>
        <legend className="text-sm font-medium">Destinatarios</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="destino"
            value="todos"
            checked={campos.destino === "todos"}
            onChange={() => set("destino", "todos")}
          />
          Todo el condominio
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="destino"
            value="torres"
            checked={campos.destino === "torres"}
            onChange={() => set("destino", "torres")}
          />
          Solo algunas torres
        </label>
        {campos.destino === "torres" && (
          <div className="ml-6 flex flex-wrap gap-4">
            {torres.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="torreIds"
                  value={t.id}
                  checked={campos.torreIds.includes(t.id)}
                  onChange={() => alternarTorre(t.id)}
                />
                {t.nombre}
              </label>
            ))}
          </div>
        )}
        {error("destino")}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="fechaPublicacion" className="text-sm font-medium">
            Fecha de publicación
          </label>
          <input
            id="fechaPublicacion"
            name="fechaPublicacion"
            type="datetime-local"
            value={campos.fechaPublicacion}
            onChange={(e) => set("fechaPublicacion", e.target.value)}
            className={inputClass}
            {...ariaDe("fechaPublicacion")}
          />
          {error("fechaPublicacion")}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="fechaExpiracion" className="text-sm font-medium">
            Expiración (opcional)
          </label>
          <input
            id="fechaExpiracion"
            name="fechaExpiracion"
            type="datetime-local"
            value={campos.fechaExpiracion}
            onChange={(e) => set("fechaExpiracion", e.target.value)}
            className={inputClass}
            {...ariaDe("fechaExpiracion")}
          />
          {error("fechaExpiracion")}
        </div>
      </div>

      <div className="flex gap-2">
        <Link href="/admin/comunicados" className={btnSecundario}>
          Cancelar
        </Link>
        <button type="submit" disabled={pending} className={btnPrimario}>
          {programar ? "Programar" : "Publicar"}
        </button>
      </div>

      {confirmar && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-comunicado"
            className="flex max-w-md flex-col gap-4 rounded-xl bg-background p-5 shadow-lg"
          >
            <p id="confirmar-comunicado">
              Se avisará a {nTorres} {nTorres === 1 ? "torre" : "torres"}.
              ¿Continuar?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirmar(false)}
                className={btnSecundario}
              >
                No
              </button>
              <button
                type="submit"
                disabled={pending}
                onClick={() => {
                  confirmado.current = true;
                }}
                className={btnPrimario}
              >
                Sí, continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
