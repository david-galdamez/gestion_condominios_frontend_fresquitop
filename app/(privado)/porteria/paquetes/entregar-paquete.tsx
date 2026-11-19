"use client";

import { startTransition, useActionState, useState } from "react";
import {
  entregarPaqueteAction,
  type EntregarPaqueteState,
} from "@/app/actions/paquetes";
import type { Paquete } from "@/lib/types/paquetes";
import {
  validarCodigoRetiro,
  validarEntrega,
  validarRecibidoPor,
  type CamposEntrega,
  type ErroresEntrega,
} from "@/lib/validaciones/paquete";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100";

type PaqueteEntrega = Pick<Paquete, "id" | "codigoPaquete" | "unidad" | "destinatario">;

// Botón "Entregar" de cada fila y su diálogo (H10). La entrega exige el código
// de retiro que el residente recibió en su aviso.
export function EntregarPaquete({ paquete }: { paquete: PaqueteEntrega }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={`Entregar ${paquete.codigoPaquete}`}
        onClick={() => setAbierto(true)}
        className="rounded-md border border-zinc-300 px-3 py-1 text-xs dark:border-zinc-700"
      >
        Entregar
      </button>
      {abierto && (
        <Dialogo paquete={paquete} onCerrar={() => setAbierto(false)} />
      )}
    </>
  );
}

const inicial: EntregarPaqueteState = { status: "idle" };

function Dialogo({
  paquete,
  onCerrar,
}: {
  paquete: PaqueteEntrega;
  onCerrar: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    entregarPaqueteAction.bind(null, paquete.id),
    inicial,
  );
  const [campos, setCampos] = useState<CamposEntrega>({
    codigoRetiro: "",
    recibidoPor: "",
  });
  const [errCliente, setErrCliente] = useState<ErroresEntrega>({});

  // Los errores del cliente (más recientes) tienen prioridad sobre los del servidor.
  const errores: ErroresEntrega = { ...state.errores, ...errCliente };
  const incompleto = Object.keys(validarEntrega(campos)).length > 0;

  function set<K extends keyof CamposEntrega>(k: K, v: string) {
    setCampos((c) => ({ ...c, [k]: v }));
    setErrCliente((e) => ({ ...e, [k]: undefined }));
  }

  // Se envía con startTransition y no con action={...}: React 19 reinicia el
  // formulario al terminar la acción y se perdería lo escrito si el código
  // fue incorrecto.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validarEntrega(campos);
    setErrCliente(errs);
    if (Object.keys(errs).length > 0) return;
    const datos = new FormData(e.currentTarget);
    startTransition(() => formAction(datos));
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="entrega-titulo"
        className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-background p-5 text-left shadow-lg"
      >
        <div>
          <h2 id="entrega-titulo" className="text-lg font-semibold">
            Entregar paquete {paquete.codigoPaquete}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Unidad {paquete.unidad} · {paquete.destinatario}
          </p>
        </div>

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          {state.mensajes && state.mensajes.length > 0 && (
            <div role="alert" className="text-sm text-red-600">
              {state.mensajes.map((m) => (
                <p key={m}>{m}</p>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="codigoRetiro" className="text-sm font-medium">
              Código de retiro
            </label>
            <input
              id="codigoRetiro"
              name="codigoRetiro"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              value={campos.codigoRetiro}
              onChange={(e) =>
                set("codigoRetiro", e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              onBlur={() =>
                setErrCliente((e) => ({
                  ...e,
                  codigoRetiro: validarCodigoRetiro(campos.codigoRetiro),
                }))
              }
              aria-invalid={errores.codigoRetiro ? true : undefined}
              aria-describedby={errores.codigoRetiro ? "codigoRetiro-error" : undefined}
              className={`${inputClass} font-mono tracking-widest`}
            />
            {errores.codigoRetiro && (
              <p id="codigoRetiro-error" className="text-sm text-red-600">
                {errores.codigoRetiro}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="recibidoPor" className="text-sm font-medium">
              Recibe
            </label>
            <input
              id="recibidoPor"
              name="recibidoPor"
              type="text"
              autoComplete="off"
              value={campos.recibidoPor}
              onChange={(e) => set("recibidoPor", e.target.value)}
              onBlur={() =>
                setErrCliente((e) => ({
                  ...e,
                  recibidoPor: validarRecibidoPor(campos.recibidoPor),
                }))
              }
              aria-invalid={errores.recibidoPor ? true : undefined}
              aria-describedby={errores.recibidoPor ? "recibidoPor-error" : undefined}
              className={inputClass}
            />
            {errores.recibidoPor && (
              <p id="recibidoPor-error" className="text-sm text-red-600">
                {errores.recibidoPor}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={onCerrar}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm disabled:opacity-60 dark:border-zinc-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending || incompleto}
              className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
            >
              {pending ? "Entregando..." : "Confirmar entrega"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
