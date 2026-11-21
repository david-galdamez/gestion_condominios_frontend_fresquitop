"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resolverReporteAction } from "@/app/actions/reportes";
import type { EstadoReporte } from "@/lib/types/reportes";
import {
  COMENTARIO_CIERRE_MAX,
  COMENTARIO_CIERRE_MIN,
  MSG_RESOLUCION,
  validarComentarioCierre,
} from "@/lib/validaciones/reporte-resolucion";

export function ResolverReporteDialog({
  reporteId,
  numero,
  estadoInicial,
}: {
  reporteId: string;
  numero: string;
  estadoInicial: EstadoReporte;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [resueltoLocal, setResueltoLocal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const puedeResolver = estadoInicial === "EN_PROCESO" && !resueltoLocal;

  if (!puedeResolver && !mensajeExito) {
    return null;
  }

  const longitudActual = comentario.length;
  const comentarioInvalido =
    validarComentarioCierre(comentario) !== null ||
    longitudActual > COMENTARIO_CIERRE_MAX;
  const excedeMaximo = longitudActual > COMENTARIO_CIERRE_MAX;

  function abrirDialogo() {
    setError(null);
    setAbierto(true);
  }

  function cerrarDialogo() {
    if (isPending) return;
    setError(null);
    setAbierto(false);
  }

  function handleConfirmar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const err = validarComentarioCierre(comentario);
    if (err) {
      setError(err);
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const res = await resolverReporteAction(reporteId, comentario);
        if (res.status === "ok") {
          setAbierto(false);
          setComentario("");
          setResueltoLocal(true);
          setMensajeExito(res.mensaje);
          router.refresh();
          return;
        }
        if (res.status === "error") {
          setError(res.mensaje);
        }
      } catch {
        setError(MSG_RESOLUCION.errorGenerico);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {mensajeExito && (
        <div
          role="status"
          className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
        >
          {mensajeExito}
        </div>
      )}

      {puedeResolver && (
        <div className="flex flex-col gap-2 rounded-xl border border-zinc-300 bg-background p-5 dark:border-zinc-800">
          <h2 className="text-base font-semibold">Resolución</h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Cuando el problema quede solucionado, cierra el reporte para avisar
            al residente.
          </p>
          <button
            type="button"
            onClick={abrirDialogo}
            className="mt-1 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Marcar como Resuelto
          </button>
        </div>
      )}

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="resolver-reporte-titulo"
            className="w-full max-w-lg rounded-xl border border-zinc-300 bg-background p-6 shadow-xl dark:border-zinc-800"
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id="resolver-reporte-titulo"
                className="text-lg font-semibold"
              >
                Marcar como Resuelto
              </h2>
              <button
                type="button"
                onClick={cerrarDialogo}
                disabled={isPending}
                aria-label="Cerrar diálogo"
                className="rounded-md px-2 py-1 text-lg leading-none text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                ×
              </button>
            </div>

            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
              ¿Marcar <strong className="tabular-nums">{numero}</strong> como
              Resuelto? Esta acción no se puede deshacer.
            </p>

            <form
              onSubmit={handleConfirmar}
              noValidate
              className="mt-4 flex flex-col gap-4"
            >
              {error && (
                <div
                  role="alert"
                  className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                >
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="comentario-cierre"
                  className="text-sm font-medium"
                >
                  Comentario de cierre <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="comentario-cierre"
                  name="comentario"
                  rows={4}
                  value={comentario}
                  disabled={isPending}
                  onChange={(e) => {
                    setComentario(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Describe la solución aplicada (mínimo 10 caracteres)..."
                  className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-600 disabled:opacity-50 dark:border-zinc-700 dark:focus:border-blue-400"
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">
                    Entre {COMENTARIO_CIERRE_MIN} y {COMENTARIO_CIERRE_MAX}{" "}
                    caracteres.
                  </span>
                  <span
                    className={`tabular-nums ${excedeMaximo ? "font-medium text-red-600 dark:text-red-400" : "text-zinc-500"}`}
                  >
                    {longitudActual} / {COMENTARIO_CIERRE_MAX}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={cerrarDialogo}
                  disabled={isPending}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={comentarioInvalido || isPending}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? "Confirmando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}