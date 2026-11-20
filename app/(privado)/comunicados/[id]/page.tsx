import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRol } from "@/lib/auth";
import { getMiComunicado } from "@/lib/comunicados";
import {
  etiquetaCategoria,
  formatFechaHoraSv,
  hrefPestana,
} from "@/lib/comunicados-ui";

export const metadata: Metadata = { title: "Comunicado" };

const btn =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700";

// Abrir esta página marca el comunicado como leído (lo hace el backend).
export default async function MiComunicadoPage({
  params,
}: PageProps<"/comunicados/[id]">) {
  await requireRol("RESIDENTE");
  const { id } = await params;
  const r = await getMiComunicado(id);
  if (r.status === "not_found") notFound();

  if (r.status !== "ok") {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Comunicado</h1>
        <p role="alert">No pudimos cargar el comunicado. Intenta de nuevo.</p>
        <Link href={`/comunicados/${id}`} className={btn}>
          Reintentar
        </Link>
      </div>
    );
  }

  const c = r.data;
  return (
    <article className="flex flex-col gap-6">
      <Link
        href={hrefPestana({ archivo: c.archivado, pagina: 1 })}
        className="text-sm text-zinc-600 hover:text-foreground dark:text-zinc-400"
      >
        ← Volver a {c.archivado ? "Archivo" : "Comunicados"}
      </Link>

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="break-words text-2xl font-semibold">{c.titulo}</h1>
          {c.archivado && (
            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Archivado
            </span>
          )}
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex gap-1">
            <dt>Categoría:</dt>
            <dd className="font-medium text-foreground">
              {etiquetaCategoria(c.categoria)}
            </dd>
          </div>
          <div className="flex gap-1">
            <dt>Publicado:</dt>
            <dd className="tabular-nums">
              <time dateTime={c.fechaPublicacion}>
                {formatFechaHoraSv(c.fechaPublicacion)}
              </time>
            </dd>
          </div>
          {c.fechaExpiracion && (
            <div className="flex gap-1">
              <dt>{c.archivado ? "Expiró:" : "Expira:"}</dt>
              <dd className="tabular-nums">
                <time dateTime={c.fechaExpiracion}>
                  {formatFechaHoraSv(c.fechaExpiracion)}
                </time>
              </dd>
            </div>
          )}
        </dl>
      </header>

      <p className="whitespace-pre-line break-words leading-relaxed">
        {c.contenido}
      </p>
    </article>
  );
}
