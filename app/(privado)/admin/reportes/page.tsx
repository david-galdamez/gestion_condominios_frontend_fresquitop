import type { Metadata } from "next";
import Link from "next/link";
import { EstadoReporteBadge } from "@/components/estado-reporte-badge";
import { PrioridadReporteBadge } from "@/components/prioridad-reporte-badge";
import { requireRol } from "@/lib/auth";
import { getAdminReportes } from "@/lib/reportes";
import { CATEGORIA_LABEL, formatFechaCorta } from "@/lib/reportes-ui";
import {
  CATEGORIAS_REPORTE,
  ESTADOS_REPORTE,
  POR_PAGINA_REPORTES,
  type AdminReportesFiltros,
  type CategoriaReporte,
  type EstadoReporte,
} from "@/lib/types/reportes";
import { FiltrosReportesForm } from "./filtros-form";

export const metadata: Metadata = { title: "Priorizar y asignar reportes" };

type SearchParams = { [key: string]: string | string[] | undefined };

const primero = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

function leerFiltros(sp: SearchParams): AdminReportesFiltros {
  const estadoRaw = primero(sp.estado);
  const categoriaRaw = primero(sp.categoria);
  const paginaNum = Number(primero(sp.pagina));

  const estado = (ESTADOS_REPORTE as readonly string[]).includes(estadoRaw ?? "")
    ? (estadoRaw as EstadoReporte)
    : undefined;
  const categoria = (CATEGORIAS_REPORTE as readonly string[]).includes(
    categoriaRaw ?? "",
  )
    ? (categoriaRaw as CategoriaReporte)
    : undefined;

  return {
    estado,
    categoria,
    pagina: Number.isInteger(paginaNum) && paginaNum >= 1 ? paginaNum : 1,
  };
}

function hrefPagina(filtros: AdminReportesFiltros, pagina: number) {
  const q = new URLSearchParams();
  if (filtros.estado) q.set("estado", filtros.estado);
  if (filtros.categoria) q.set("categoria", filtros.categoria);
  q.set("pagina", String(pagina));
  return `/admin/reportes?${q.toString()}`;
}

const btnPag =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700";
const btnPagOff = `${btnPag} cursor-not-allowed opacity-50`;

export default async function AdminReportesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRol("ADMINISTRADOR");
  const filtros = leerFiltros(await searchParams);
  const r = await getAdminReportes(filtros);

  if (r.status === "forbidden") {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Priorizar y asignar reportes</h1>
        <p role="alert">No tienes permiso para esta acción</p>
      </div>
    );
  }

  if (r.status === "error") {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Priorizar y asignar reportes</h1>
        <p role="alert">
          No pudimos cargar los reportes. Intenta de nuevo.
        </p>
        <Link
          href={hrefPagina(filtros, filtros.pagina ?? 1)}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Reintentar
        </Link>
      </div>
    );
  }

  const { datos, total, pagina, porPagina } = r.data;
  const tamPagina = porPagina || POR_PAGINA_REPORTES;
  const desdeN = datos.length === 0 ? 0 : (pagina - 1) * tamPagina + 1;
  const hastaN = (pagina - 1) * tamPagina + datos.length;
  const hayAnterior = pagina > 1;
  const haySiguiente = pagina * tamPagina < total;

  const sinAsignar = datos.filter(
    (d) => d.estado === "ABIERTO" && d.prioridad === null,
  ).length;
  const enProceso = datos.filter((d) => d.estado === "EN_PROCESO").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Priorizar y asignar reportes</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Reportes ordenados por prioridad (Alta → Media → Baja → Sin asignar) y
          antigüedad.
        </p>
      </div>

      <section
        aria-label="Resumen de reportes en esta vista"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <div className="rounded-xl border border-zinc-300 bg-background p-5 dark:border-zinc-800">
          <h2 className="text-sm text-zinc-600 dark:text-zinc-400">
            Reportes sin asignar (Abiertos)
          </h2>
          <p className="mt-1 text-3xl font-bold tabular-nums">{sinAsignar}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Requieren prioridad y responsable
          </p>
        </div>

        <div className="rounded-xl border border-zinc-300 bg-background p-5 dark:border-zinc-800">
          <h2 className="text-sm text-zinc-600 dark:text-zinc-400">
            Reportes En proceso
          </h2>
          <p className="mt-1 text-3xl font-bold tabular-nums">{enProceso}</p>
          <p className="mt-1 text-xs text-zinc-500">Con atención activa</p>
        </div>
      </section>

      <FiltrosReportesForm
        estado={filtros.estado}
        categoria={filtros.categoria}
      />

      {datos.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 py-10 text-center dark:border-zinc-800">
          <p className="text-zinc-600 dark:text-zinc-400">
            No hay reportes que coincidan con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-zinc-300 dark:border-zinc-800">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="border-b border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Número</th>
                  <th className="px-3 py-2.5 font-semibold">Título</th>
                  <th className="px-3 py-2.5 font-semibold">Categoría</th>
                  <th className="px-3 py-2.5 font-semibold">Ubicación</th>
                  <th className="px-3 py-2.5 font-semibold">Prioridad</th>
                  <th className="px-3 py-2.5 font-semibold">Responsable</th>
                  <th className="px-3 py-2.5 font-semibold">Estado</th>
                  <th className="px-3 py-2.5 font-semibold">Fecha</th>
                  <th className="px-3 py-2.5 font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody>
                {datos.map((rep) => (
                  <tr
                    key={rep.id}
                    className="border-b border-zinc-200 last:border-b-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
                  >
                    <td className="px-3 py-2.5 font-medium tabular-nums">
                      {rep.numero}
                    </td>
                    <td className="max-w-56 truncate px-3 py-2.5 font-medium">
                      {rep.titulo}
                    </td>
                    <td className="px-3 py-2.5">
                      {CATEGORIA_LABEL[rep.categoria] ?? rep.categoria}
                    </td>
                    <td className="px-3 py-2.5">{rep.ubicacion}</td>
                    <td className="px-3 py-2.5">
                      <PrioridadReporteBadge prioridad={rep.prioridad} />
                    </td>
                    <td className="px-3 py-2.5">
                      {rep.responsable ?? (
                        <span className="text-zinc-400">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <EstadoReporteBadge estado={rep.estado} />
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">
                      {formatFechaCorta(rep.creadoEn)}
                    </td>
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/admin/reportes/${rep.id}`}
                        className="font-medium text-blue-700 hover:underline dark:text-blue-400"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > tamPagina && (
            <nav
              aria-label="Paginación"
              className="flex flex-wrap items-center justify-between gap-3 text-sm"
            >
              <span className="text-zinc-600 dark:text-zinc-400">
                Mostrando {desdeN}–{hastaN} de {total} · {tamPagina} por página
              </span>
              <div className="flex items-center gap-2">
                {hayAnterior ? (
                  <Link
                    href={hrefPagina(filtros, pagina - 1)}
                    className={btnPag}
                  >
                    Anterior
                  </Link>
                ) : (
                  <span aria-disabled="true" className={btnPagOff}>
                    Anterior
                  </span>
                )}
                <span className="px-2 font-medium tabular-nums">{pagina}</span>
                {haySiguiente ? (
                  <Link
                    href={hrefPagina(filtros, pagina + 1)}
                    className={btnPag}
                  >
                    Siguiente
                  </Link>
                ) : (
                  <span aria-disabled="true" className={btnPagOff}>
                    Siguiente
                  </span>
                )}
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}