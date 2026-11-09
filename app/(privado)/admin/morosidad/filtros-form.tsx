"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { TORRES_DEFAULT, type TorreOpcion } from "@/lib/types/morosidad";

const selectClass =
  "rounded-md border border-zinc-300 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100";

export function FiltrosMorosidadForm({
  torres = TORRES_DEFAULT,
  torreId,
}: {
  torres?: TorreOpcion[];
  torreId?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const valorInicial = torreId ?? params.get("torreId") ?? "";

  function aplicarTorre(valor: string) {
    const next = new URLSearchParams();
    if (valor.trim()) {
      next.set("torreId", valor.trim());
    }
    const qs = next.toString();
    router.push(qs ? `/admin/morosidad?${qs}` : "/admin/morosidad");
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const seleccion = String(f.get("torreId") ?? "");
    aplicarTorre(seleccion);
  }

  const key = params.toString();

  return (
    <form
      key={key}
      onSubmit={onSubmit}
      className="flex flex-wrap items-center gap-3"
    >
      <label htmlFor="torreId" className="text-sm font-medium">
        Torre
      </label>
      <select
        id="torreId"
        name="torreId"
        defaultValue={valorInicial}
        onChange={(e) => aplicarTorre(e.target.value)}
        className={`${selectClass} min-w-36`}
      >
        <option value="">Todas</option>
        {torres.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nombre}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-md border border-zinc-400 bg-zinc-100 px-4 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        Aplicar
      </button>
    </form>
  );
}