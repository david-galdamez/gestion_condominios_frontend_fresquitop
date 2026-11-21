"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIA_LABEL, ESTADO_REPORTE_LABEL } from "@/lib/reportes-ui";
import {
  CATEGORIAS_REPORTE,
  ESTADOS_REPORTE,
  type CategoriaReporte,
  type EstadoReporte,
} from "@/lib/types/reportes";

const selectClass =
  "rounded-md border border-zinc-300 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100";

export function FiltrosReportesForm({
  estado,
  categoria,
}: {
  estado?: EstadoReporte;
  categoria?: CategoriaReporte;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const estadoInicial = estado ?? params.get("estado") ?? "";
  const categoriaInicial = categoria ?? params.get("categoria") ?? "";

  function navegar(nuevoEstado: string, nuevaCategoria: string) {
    const next = new URLSearchParams();
    if (nuevoEstado) next.set("estado", nuevoEstado);
    if (nuevaCategoria) next.set("categoria", nuevaCategoria);
    const qs = next.toString();
    router.push(qs ? `/admin/reportes?${qs}` : "/admin/reportes");
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    navegar(String(f.get("estado") ?? ""), String(f.get("categoria") ?? ""));
  }

  return (
    <form
      key={params.toString()}
      onSubmit={onSubmit}
      className="flex flex-wrap items-center gap-3"
    >
      <div className="flex items-center gap-2">
        <label htmlFor="estado" className="text-sm font-medium">
          Estado
        </label>
        <select
          id="estado"
          name="estado"
          defaultValue={estadoInicial}
          onChange={(e) => navegar(e.target.value, categoriaInicial)}
          className={selectClass}
        >
          <option value="">Todos</option>
          {ESTADOS_REPORTE.map((est) => (
            <option key={est} value={est}>
              {ESTADO_REPORTE_LABEL[est]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="categoria" className="text-sm font-medium">
          Categoría
        </label>
        <select
          id="categoria"
          name="categoria"
          defaultValue={categoriaInicial}
          onChange={(e) => navegar(estadoInicial, e.target.value)}
          className={selectClass}
        >
          <option value="">Todas</option>
          {CATEGORIAS_REPORTE.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORIA_LABEL[cat]}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="rounded-md border border-zinc-400 bg-zinc-100 px-4 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        Aplicar
      </button>
    </form>
  );
}