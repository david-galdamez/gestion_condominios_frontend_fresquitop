import type { Metadata } from "next";
import Link from "next/link";
import { EstadoReporteBadge } from "@/components/estado-reporte-badge";
import { requireRol } from "@/lib/auth";
import { getMisReportes } from "@/lib/reportes";
import { CATEGORIA_LABEL, formatFechaCorta } from "@/lib/reportes-ui";

export const metadata: Metadata = { title: "Mis reportes" };

type SearchParams = { [key: string]: string | string[] | undefined };

const btn =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700";
const btnOff = `${btn} cursor-not-allowed opacity-50`;

function leerPagina(sp: SearchParams) {
  const raw = Array.isArray(sp.pagina) ? sp.pagina[0] : sp.pagina;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

export default async function MisReportesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRol("RESIDENTE");
  const pagina = leerPagina(await searchParams);
  const r = await getMisReportes(pagina);

  if (r.status === "error") {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Mis reportes</h1>
        <p role="alert">No pudimos cargar tus reportes. Intenta de nuevo.</p>
        <Link href={`/reportes?pagina=${pagina}`} className={btn}>
          Reintentar
        </Link>
      </div>
    );
  }

  const { datos, total, porPagina } = r.data;
  const desdeN = (pagina - 1) * porPagina + 1;
  const hastaN = (pagina - 1) * porPagina + datos.length;
  const hayAnterior = pagina > 1;
  const haySiguiente = pagina * porPagina < total;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Mis reportes</h1>
        <Link
          href="/reportes/nuevo"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Reportar un problema
        </Link>
      </div>

      {datos.length === 0 ? (
        <p className="py-8 text-center text-zinc-600 dark:text-zinc-400">
          {total === 0
            ? "Aún no has reportado ningún problema"
            : "No hay reportes en esta página"}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="py-2 pr-4 font-medium">Número</th>
                  <th className="py-2 pr-4 font-medium">Título</th>
                  <th className="py-2 pr-4 font-medium">Categoría</th>
                  <th className="py-2 pr-4 font-medium">Fecha</th>
                  <th className="py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {datos.map((rep) => (
                  <tr
                    key={rep.id}
                    className="border-b border-zinc-100 dark:border-zinc-900"
                  >
                    <td className="py-2 pr-4 tabular-nums">
                      <Link
                        href={`/reportes/${rep.numero}`}
                        className="font-medium underline-offset-2 hover:underline"
                      >
                        {rep.numero}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">{rep.titulo}</td>
                    <td className="py-2 pr-4">
                      {CATEGORIA_LABEL[rep.categoria] ?? rep.categoria}
                    </td>
                    <td className="py-2 pr-4 tabular-nums">
                      {formatFechaCorta(rep.creadoEn)}
                    </td>
                    <td className="py-2">
                      <EstadoReporteBadge estado={rep.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav
            aria-label="Paginación"
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="text-zinc-600 dark:text-zinc-400">
              Mostrando {desdeN}–{hastaN} de {total}
            </span>
            <div className="flex gap-2">
              {hayAnterior ? (
                <Link href={`/reportes?pagina=${pagina - 1}`} className={btn}>
                  Anterior
                </Link>
              ) : (
                <span aria-disabled="true" className={btnOff}>
                  Anterior
                </span>
              )}
              {haySiguiente ? (
                <Link href={`/reportes?pagina=${pagina + 1}`} className={btn}>
                  Siguiente
                </Link>
              ) : (
                <span aria-disabled="true" className={btnOff}>
                  Siguiente
                </span>
              )}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
