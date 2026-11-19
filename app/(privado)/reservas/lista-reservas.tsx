"use client";

import { useState, useTransition } from "react";
import { cancelarReservaAction } from "@/app/actions/reservas";
import { EstadoReservaBadge } from "@/components/estado-reserva-badge";
import { formatFecha } from "@/lib/format";
import type { Reserva } from "@/lib/types/reservas";

export function ListaReservas({ reservas }: { reservas: Reserva[] }) {
  const [aCancelar, setACancelar] = useState<Reserva | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function confirmar() {
    if (!aCancelar) return;
    const id = aCancelar.id;
    start(async () => {
      const r = await cancelarReservaAction(id);
      setError(r.ok ? "" : r.error);
      // La acción ya revalida /reservas; la lista se actualiza sola.
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
              <th className="py-2 pr-4 font-medium">Código</th>
              <th className="py-2 pr-4 font-medium">Área</th>
              <th className="py-2 pr-4 font-medium">Fecha</th>
              <th className="py-2 pr-4 font-medium">Horario</th>
              <th className="py-2 pr-4 text-right font-medium">Asistentes</th>
              <th className="py-2 pr-4 font-medium">Estado</th>
              <th className="py-2 font-medium">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {reservas.map((r) => (
              <tr
                key={r.id}
                className="border-b border-zinc-100 dark:border-zinc-900"
              >
                <td className="py-2 pr-4 font-mono tabular-nums">{r.codigo}</td>
                <td className="py-2 pr-4">{r.area}</td>
                <td className="py-2 pr-4 tabular-nums">{formatFecha(r.fecha)}</td>
                <td className="py-2 pr-4 tabular-nums">
                  {r.horaInicio} – {r.horaFin}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {r.asistentes}
                </td>
                <td className="py-2 pr-4">
                  <EstadoReservaBadge estado={r.estado} />
                </td>
                <td className="py-2 text-right">
                  {r.estado === "CONFIRMADA" && (
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setACancelar(r);
                      }}
                      className="rounded-md border border-zinc-300 px-3 py-1 text-xs dark:border-zinc-700"
                    >
                      Cancelar
                    </button>
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
            aria-labelledby="cancelar-titulo"
            className="flex max-w-md flex-col gap-4 rounded-xl bg-background p-5 shadow-lg"
          >
            <p id="cancelar-titulo">
              ¿Cancelar la reserva {aCancelar.codigo} de {aCancelar.area} del{" "}
              {formatFecha(aCancelar.fecha)}, de {aCancelar.horaInicio} a{" "}
              {aCancelar.horaFin}? Solo se puede cancelar con 24 horas o más de
              anticipación.
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
