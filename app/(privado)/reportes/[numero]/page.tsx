import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EstadoReporteBadge } from "@/components/estado-reporte-badge";
import { requireRol } from "@/lib/auth";
import { getReporte } from "@/lib/reportes";
import { CATEGORIA_LABEL, formatFechaHora } from "@/lib/reportes-ui";
import { MSG_RESOLUCION } from "@/lib/validaciones/reporte-resolucion";

type SearchParams = { [key: string]: string | string[] | undefined };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ numero: string }>;
}): Promise<Metadata> {
  const { numero } = await params;
  return { title: `Reporte ${numero}` };
}

export default async function ReporteDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ numero: string }>;
  searchParams: Promise<SearchParams>;
}) {
  await requireRol("RESIDENTE");
  const { numero } = await params;
  const creado = (await searchParams).creado === "1";

  const r = await getReporte(numero);
  if (r.status === "not_found") notFound();

  if (r.status === "error") {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Reporte {numero}</h1>
        <p role="alert">No pudimos cargar el reporte. Intenta de nuevo.</p>
        <Link
          href={`/reportes/${numero}`}
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
      {creado && (
        <div
          role="status"
          className="rounded-md border border-green-300 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
        >
          Tu reporte quedó registrado con el número{" "}
          <strong className="tabular-nums">{rep.numero}</strong> en estado
          Abierto.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">
          <span className="tabular-nums">{rep.numero}</span> · {rep.titulo}
        </h1>
        <EstadoReporteBadge estado={rep.estado} />
      </div>

      {rep.estado === "RESUELTO" && (
        <div
          role="note"
          className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-900 dark:border-green-900 dark:bg-green-950/60 dark:text-green-200"
        >
          <p>{MSG_RESOLUCION.notaResueltoResidente}</p>
        </div>
      )}

      <dl className="grid gap-4 text-sm sm:grid-cols-3">
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
          <dt className="text-zinc-600 dark:text-zinc-400">Reportado</dt>
          <dd className="font-medium tabular-nums">
            {formatFechaHora(rep.creadoEn)}
          </dd>
        </div>
        {rep.resueltoEn && (
          <div>
            <dt className="text-zinc-600 dark:text-zinc-400">Resuelto</dt>
            <dd className="font-medium tabular-nums">
              {formatFechaHora(rep.resueltoEn)}
            </dd>
          </div>
        )}
      </dl>

      <section className="flex flex-col gap-1">
        <h2 className="text-sm text-zinc-600 dark:text-zinc-400">Descripción</h2>
        <p className="whitespace-pre-wrap">{rep.descripcion}</p>
      </section>

      {rep.fotos.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm text-zinc-600 dark:text-zinc-400">
            Fotos ({rep.fotos.length})
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {rep.fotos.map((url, i) => {
              // El backend devuelve su propia ruta; el navegador las pide al
              // proxy del frontend (que tiene el token), por eso se rearma.
              const fotoId = url.split("/").pop() ?? "";
              const src = `/api/reportes/${rep.numero}/fotos/${fotoId}`;
              return (
                <li key={fotoId}>
                  <a href={src} target="_blank" rel="noreferrer">
                    {/* Ruta propia con sesión: next/image no puede pedirla. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Foto ${i + 1} del reporte ${rep.numero}`}
                      className="aspect-square w-full rounded-md border border-zinc-200 object-cover dark:border-zinc-800"
                    />
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section
        aria-labelledby="historial-estados-titulo"
        className="rounded-xl border border-zinc-300 bg-background p-4 sm:p-5 dark:border-zinc-800"
      >
        <h2
          id="historial-estados-titulo"
          className="mb-4 text-base font-semibold"
        >
          Historial de estados
        </h2>
        {rep.historial.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Aún no hay movimientos registrados para este reporte.
          </p>
        ) : (
          <ol className="relative flex flex-col gap-4 border-l-2 border-zinc-200 pl-5 dark:border-zinc-800">
            {rep.historial.map((item) => {
              const esResuelto = item.estado === "RESUELTO";
              return (
                <li key={item.id} className="relative">
                  <span
                    aria-hidden="true"
                    className={`absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-background ${
                      esResuelto
                        ? "bg-green-600 dark:bg-green-400"
                        : item.estado === "EN_PROCESO"
                          ? "bg-blue-600 dark:bg-blue-400"
                          : "bg-amber-500 dark:bg-amber-400"
                    }`}
                  />
                  <div
                    className={`rounded-lg border p-3 text-sm ${
                      esResuelto
                        ? "border-green-300 bg-green-50/70 dark:border-green-900 dark:bg-green-950/40"
                        : "border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <EstadoReporteBadge estado={item.estado} />
                      <time
                        dateTime={item.fecha}
                        className="text-xs text-zinc-600 tabular-nums dark:text-zinc-400"
                      >
                        {formatFechaHora(item.fecha)}
                      </time>
                    </div>
                    {item.comentario && (
                      <div className="mt-2">
                        {esResuelto && (
                          <p className="text-xs font-semibold text-green-800 dark:text-green-300">
                            Comentario de resolución
                          </p>
                        )}
                        <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">
                          {item.comentario}
                        </p>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <div>
        <Link
          href="/reportes"
          className="inline-block rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          Volver a mis reportes
        </Link>
      </div>
    </div>
  );
}