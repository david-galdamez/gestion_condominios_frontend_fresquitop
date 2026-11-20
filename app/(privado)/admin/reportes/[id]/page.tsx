import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EstadoReporteBadge } from "@/components/estado-reporte-badge";
import { PrioridadReporteBadge } from "@/components/prioridad-reporte-badge";
import { requireRol } from "@/lib/auth";
import { getAdminReporteDetalle } from "@/lib/reportes";
import { CATEGORIA_LABEL, formatFechaHora } from "@/lib/reportes-ui";
import { AsignacionReporteForm } from "./asignacion-form";

export const metadata: Metadata = { title: "Detalle de reporte" };

export default async function AdminReporteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRol("ADMINISTRADOR");
  const { id } = await params;

  const r = await getAdminReporteDetalle(id);

  if (r.status === "not_found") notFound();

  if (r.status === "forbidden") {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Detalle de reporte</h1>
        <p role="alert">No tienes permiso para esta acción</p>
      </div>
    );
  }

  if (r.status === "error") {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Detalle de reporte</h1>
        <p role="alert">No pudimos cargar el reporte. Intenta de nuevo.</p>
        <Link
          href={`/admin/reportes/${id}`}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          Reintentar
        </Link>
      </div>
    );
  }

  const rep = r.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">
            <span className="tabular-nums">{rep.numero}</span> · {rep.titulo}
          </h1>
          <EstadoReporteBadge estado={rep.estado} />
          <PrioridadReporteBadge prioridad={rep.prioridad} />
        </div>
        <Link
          href="/admin/reportes"
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          Volver a reportes
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-xl border border-zinc-300 bg-background p-5 dark:border-zinc-800">
            <h2 className="mb-4 text-base font-semibold">Datos del reporte</h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-zinc-600 dark:text-zinc-400">Categoría</dt>
                <dd className="font-medium">
                  {CATEGORIA_LABEL[rep.categoria] ?? rep.categoria}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-600 dark:text-zinc-400">Ubicación</dt>
                <dd className="font-medium">{rep.ubicacion}</dd>
              </div>
              <div>
                <dt className="text-zinc-600 dark:text-zinc-400">Reportado por</dt>
                <dd className="font-medium">
                  {rep.residente.nombre}
                  {rep.unidades.length > 0
                    ? ` (${rep.unidades.join(", ")})`
                    : ""}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-600 dark:text-zinc-400">Fecha</dt>
                <dd className="font-medium tabular-nums">
                  {formatFechaHora(rep.creadoEn)}
                </dd>
              </div>
            </dl>

            <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <h3 className="text-sm text-zinc-600 dark:text-zinc-400">
                Descripción
              </h3>
              <p className="mt-1 whitespace-pre-wrap text-sm">
                {rep.descripcion}
              </p>
            </div>
          </section>

          {rep.evidencias.length > 0 && (
            <section className="rounded-xl border border-zinc-300 bg-background p-5 dark:border-zinc-800">
              <h2 className="mb-3 text-base font-semibold">
                Evidencias ({rep.evidencias.length})
              </h2>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {rep.evidencias.map((ev, i) => {
                  const src = `/api/reportes/${rep.numero}/fotos/${ev.id}`;
                  return (
                    <li key={ev.id}>
                      <a href={src} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={`Evidencia ${i + 1} del reporte ${rep.numero}`}
                          className="aspect-square w-full rounded-md border border-zinc-200 object-cover dark:border-zinc-800"
                        />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className="rounded-xl border border-zinc-300 bg-background p-5 dark:border-zinc-800">
            <h2 className="mb-3 text-base font-semibold">Historial de cambios</h2>
            {rep.historial.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Aún no hay movimientos registrados.
              </p>
            ) : (
              <ol className="flex flex-col gap-3">
                {rep.historial.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <EstadoReporteBadge estado={item.estado} />
                      <span className="text-xs text-zinc-500 tabular-nums">
                        {formatFechaHora(item.fecha)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                      Por <strong className="text-foreground">{item.autor.nombre}</strong>
                    </p>
                    {item.comentario && (
                      <p className="mt-1 text-sm">{item.comentario}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside>
          <AsignacionReporteForm
            reporteId={rep.id}
            estadoInicial={rep.estado}
            prioridadInicial={rep.prioridad}
            responsableInicial={rep.responsable}
          />
        </aside>
      </div>
    </div>
  );
}