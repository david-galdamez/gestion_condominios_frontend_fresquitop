"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { validarRango } from "@/lib/panel-periodo";
import { PERIODOS, type PeriodoClave } from "@/lib/types/panel";

const campo =
  "rounded-md border border-zinc-300 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100";

// El periodo se guarda en la URL (?periodo=&desde=&hasta=) para poder
// compartirlo y para que H20 exporte exactamente lo que se ve.
export function SelectorPeriodo({
  periodo,
  desde,
  hasta,
}: {
  periodo: PeriodoClave;
  desde: string;
  hasta: string;
}) {
  const router = useRouter();
  const [clave, setClave] = useState<PeriodoClave>(periodo);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const q = new URLSearchParams({ periodo: clave });
    if (clave === "rango") {
      const d = String(f.get("desde") ?? "");
      const h = String(f.get("hasta") ?? "");
      const msg = validarRango(d, h);
      if (msg) return setError(msg);
      q.set("desde", d);
      q.set("hasta", h);
    }
    setError(null);
    router.push(`/admin/panel?${q.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2" noValidate>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="periodo" className="text-sm font-medium">
            Periodo
          </label>
          <select
            id="periodo"
            value={clave}
            onChange={(e) => {
              setClave(e.target.value as PeriodoClave);
              setError(null);
            }}
            className={`${campo} min-w-44`}
          >
            {PERIODOS.map((p) => (
              <option key={p.clave} value={p.clave}>
                {p.etiqueta}
              </option>
            ))}
          </select>
        </div>

        {clave === "rango" && (
          <>
            <div className="flex flex-col gap-1">
              <label htmlFor="desde" className="text-sm font-medium">
                Desde
              </label>
              <input
                id="desde"
                name="desde"
                type="date"
                defaultValue={periodo === "rango" ? desde : ""}
                className={campo}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="hasta" className="text-sm font-medium">
                Hasta
              </label>
              <input
                id="hasta"
                name="hasta"
                type="date"
                defaultValue={periodo === "rango" ? hasta : ""}
                className={campo}
              />
            </div>
          </>
        )}

        <button
          type="submit"
          className="rounded-md border border-zinc-400 bg-zinc-100 px-4 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
        >
          Aplicar
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
