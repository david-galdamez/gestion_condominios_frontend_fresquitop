"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { cancelarVisita } from "@/app/actions/visitas";
import { EstadoAutorizacionBadge } from "@/components/estado-autorizacion-badge";
import { formatFecha } from "@/lib/format";
import type { Autorizacion } from "@/lib/types/visitas";

const docLabel = { DUI: "DUI", PASAPORTE: "Pasaporte" } as const;

export function ListaVisitas({
  autorizaciones,
}: {
  autorizaciones: Autorizacion[];
}) {
  const [aCancelar, setACancelar] = useState<Autorizacion | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function confirmar() {
    if (!aCancelar) return;
    const id = aCancelar.id;
    start(async () => {
      const r = await cancelarVisita(id);
      setError(r.ok ? "" : r.error);
      // La acción ya revalida /visitas; la lista se actualiza sola.
      setACancelar(null);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="py-2 pr-4 font-medium">Fecha y hora</th>
              <th className="py-2 pr-4 font-medium">Visitante</th>
              <th className="py-2 pr-4 font-medium">Documento</th>
              <th className="py-2 pr-4 font-medium">Placa</th>
              <th className="py-2 pr-4 font-medium">Unidad</th>
              <th className="py-2 pr-4 font-medium">Código</th>
              <th className="py-2 pr-4 font-medium">Estado</th>
              <th className="py-2 font-medium">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {autorizaciones.map((a) => (
              <tr
                key={a.id}
                className="border-b border-zinc-100 dark:border-zinc-900"
              >
                <td className="py-2 pr-4 tabular-nums">
                  {formatFecha(a.fechaVisita)} {a.horaEstimada}
                </td>
                <td className="py-2 pr-4">{a.nombre}</td>
                <td className="py-2 pr-4">
                  {docLabel[a.tipoDocumento] ?? a.tipoDocumento}{" "}
                  {a.numeroDocumento}
                </td>
                <td className="py-2 pr-4">{a.placa || "—"}</td>
                <td className="py-2 pr-4">{a.unidad.codigo}</td>
                <td className="py-2 pr-4 font-mono tabular-nums">{a.codigo}</td>
                <td className="py-2 pr-4">
                  <EstadoAutorizacionBadge estado={a.estado} />
                </td>
                <td className="py-2 text-right">
                  {a.estado === "VIGENTE" && (
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/visitas/${a.id}/editar`}
                        className="rounded-md border border-zinc-300 px-3 py-1 text-xs dark:border-zinc-700"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setError("");
                          setACancelar(a);
                        }}
                        className="rounded-md border border-zinc-300 px-3 py-1 text-xs dark:border-zinc-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {aCancelar && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-titulo"
            className="flex max-w-md flex-col gap-4 rounded-xl bg-background p-5 shadow-lg"
          >
            <p id="confirmar-titulo">
              ¿Cancelar la autorización de {aCancelar.nombre} para el{" "}
              {formatFecha(aCancelar.fechaVisita)}? El código dejará de
              funcionar.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => setACancelar(null)}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm disabled:opacity-60 dark:border-zinc-700"
              >
                No
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={confirmar}
                className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
