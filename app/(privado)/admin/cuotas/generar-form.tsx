"use client";

import { useActionState } from "react";
import {
  generarCuotasAction,
  type GenerarCuotasState,
} from "@/app/actions/cuotas";
import { formatPeriodo } from "@/lib/format";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100";
const btnPrimario =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60";

const inicial: GenerarCuotasState = { status: "idle" };

// FE-2.2: generación manual del mes actual o el siguiente y su resultado.
export function GenerarForm({
  periodos,
  habilitado,
}: {
  periodos: string[];
  habilitado: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    generarCuotasAction,
    inicial,
  );

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Generar cuotas del mes</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          El sistema las genera solo el día 1 de cada mes. Usa esta opción si
          necesitas adelantar o repetir una generación: las unidades que ya
          tienen cuota del periodo se omiten.
        </p>
      </div>

      {!habilitado && (
        <p role="alert" className="text-sm text-amber-700 dark:text-amber-400">
          Guarda primero la configuración de la cuota.
        </p>
      )}

      {state.status === "ok" && state.mensajes && (
        <div
          role="status"
          className="rounded-md border border-green-600/40 bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-200"
        >
          {state.mensajes.map((m) => (
            <p key={m}>{m}</p>
          ))}
        </div>
      )}
      {state.status === "error" && state.mensajes && (
        <div role="alert" className="text-sm text-red-600">
          {state.mensajes.map((m) => (
            <p key={m}>{m}</p>
          ))}
        </div>
      )}

      <form action={formAction} className="flex max-w-xl flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="periodo" className="text-sm font-medium">
            Periodo
          </label>
          <select
            id="periodo"
            name="periodo"
            defaultValue={periodos[0]}
            disabled={!habilitado}
            className={inputClass}
          >
            {periodos.map((p) => (
              <option key={p} value={p}>
                {formatPeriodo(p)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={!habilitado || pending}
          className={btnPrimario}
        >
          {pending ? "Generando..." : "Generar cuotas"}
        </button>
      </form>
    </section>
  );
}
