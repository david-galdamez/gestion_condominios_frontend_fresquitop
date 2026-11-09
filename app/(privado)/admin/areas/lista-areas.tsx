"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { actualizarEstadoArea } from "@/app/actions/areas";
import type { Area } from "@/lib/types/areas";

export function ListaAreas({ areas }: { areas: Area[] }) {
  const [aDesactivar, setADesactivar] = useState<Area | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function cambiar(area: Area, activa: boolean) {
    setError("");
    start(async () => {
      const r = await actualizarEstadoArea(area.id, activa);
      setError(r.ok ? "" : r.error);
      // La acción ya revalida /admin/areas; la lista se actualiza sola.
      setADesactivar(null);
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
              <th className="py-2 pr-4 font-medium">Nombre</th>
              <th className="py-2 pr-4 font-medium">Capacidad</th>
              <th className="py-2 pr-4 font-medium">Horario</th>
              <th className="py-2 pr-4 font-medium">Máx. por reserva</th>
              <th className="py-2 pr-4 font-medium">Estado</th>
              <th className="py-2 font-medium">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {areas.map((a) => (
              <tr
                key={a.id}
                className="border-b border-zinc-100 dark:border-zinc-900"
              >
                <td className="py-2 pr-4">{a.nombre}</td>
                <td className="py-2 pr-4 tabular-nums">{a.capacidad}</td>
                <td className="py-2 pr-4 tabular-nums">
                  {a.horaApertura}–{a.horaCierre}
                </td>
                <td className="py-2 pr-4 tabular-nums">
                  {a.duracionMaxHoras} h
                </td>
                <td className="py-2 pr-4">
                  <span
                    className={
                      a.activa
                        ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100"
                        : "rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    }
                  >
                    {a.activa ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="py-2">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/areas/${a.id}/editar`}
                      aria-label={`Editar ${a.nombre}`}
                      className="rounded-md border border-zinc-300 px-3 py-1 text-xs dark:border-zinc-700"
                    >
                      Editar
                    </Link>
                    {a.activa ? (
                      <button
                        type="button"
                        disabled={pending}
                        aria-label={`Desactivar ${a.nombre}`}
                        onClick={() => {
                          setError("");
                          setADesactivar(a);
                        }}
                        className="rounded-md border border-zinc-300 px-3 py-1 text-xs disabled:opacity-60 dark:border-zinc-700"
                      >
                        Desactivar
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={pending}
                        aria-label={`Activar ${a.nombre}`}
                        onClick={() => cambiar(a, true)}
                        className="rounded-md border border-zinc-300 px-3 py-1 text-xs disabled:opacity-60 dark:border-zinc-700"
                      >
                        Activar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {aDesactivar && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-titulo"
            className="flex max-w-md flex-col gap-4 rounded-xl bg-background p-5 shadow-lg"
          >
            <p id="confirmar-titulo">
              ¿Desactivar “{aDesactivar.nombre}”? No aceptará reservas nuevas;
              las reservas futuras Confirmadas se mantienen.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => setADesactivar(null)}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm disabled:opacity-60 dark:border-zinc-700"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => cambiar(aDesactivar, false)}
                className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
              >
                Sí, desactivar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
