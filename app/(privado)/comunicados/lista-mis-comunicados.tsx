import Link from "next/link";
import { etiquetaCategoria, formatFechaHoraSv } from "@/lib/comunicados-ui";
import type { MiComunicadoResumen } from "@/lib/types/comunicados";

export function ListaMisComunicados({
  comunicados,
}: {
  comunicados: MiComunicadoResumen[];
}) {
  return (
    <ul className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {comunicados.map((c) => (
        <li key={c.id}>
          <Link
            href={`/comunicados/${c.id}`}
            className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <span
              aria-hidden="true"
              className={`mt-1.5 size-2.5 shrink-0 rounded-full ${c.leido ? "bg-transparent" : "bg-blue-600"}`}
            />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className={`break-words ${c.leido ? "" : "font-semibold"}`}>
                  {c.titulo}
                </span>
                {!c.leido && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                    No leído
                  </span>
                )}
              </span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {etiquetaCategoria(c.categoria)} ·{" "}
                <time dateTime={c.fechaPublicacion} className="tabular-nums">
                  {formatFechaHoraSv(c.fechaPublicacion)}
                </time>
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
