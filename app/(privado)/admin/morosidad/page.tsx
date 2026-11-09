import type { Metadata } from "next";
import Link from "next/link";
import { requireRol } from "@/lib/auth";
import { formatFecha, formatUsd } from "@/lib/format";
import { getMorosidad } from "@/lib/morosidad";
import {
  POR_PAGINA_MOROSIDAD,
  type MorosidadFiltros,
} from "@/lib/types/morosidad";
import { FiltrosMorosidadForm } from "./filtros-form";
import { leerFiltros, type SearchParams } from "./leer-filtros";
import { ReintentarButton } from "./reintentar-button";

export const metadata: Metadata = { title: "Morosidad de Unidades" };

function hrefPagina(filtros: MorosidadFiltros, pagina: number) {
  const q = new URLSearchParams();
  if (filtros.torreId) q.set("torreId", filtros.torreId);
  q.set("pagina", String(pagina));
  return `/admin/morosidad?${q.toString()}`;
}

const btnPag =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700";
const btnPagOff = `${btnPag} cursor-not-allowed opacity-50`;

export default async function MorosidadPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRol("ADMINISTRADOR");
  const filtros = leerFiltros(await searchParams);
  const r = await getMorosidad(filtros);

  if (r.status === "forbidden") {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Morosidad de Unidades</h1>
        <p role="alert">No tienes permiso para esta acción</p>
      </div>
    );
  }

  if (r.status === "error") {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Morosidad de Unidades</h1>
        <p role="alert">
          No pudimos cargar el reporte de morosidad. Intenta de nuevo.
        </p>
        <ReintentarButton />
      </div>
    );
  }

  if (r.status === "not_found" || r.status === "bad_request") {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Morosidad de Unidades</h1>
        <FiltrosMorosidadForm torreId={filtros.torreId} />
        <p role="alert" className="text-sm text-red-600">
          {r.message}
        </p>
      </div>
    );
  }

  const { totalMora, unidadesMorosas, datos, total, pagina } = r.data;
  const desdeN = datos.length === 0 ? 0 : (pagina - 1) * POR_PAGINA_MOROSIDAD + 1;
  const hastaN = (pagina - 1) * POR_PAGINA_MOROSIDAD + datos.length;
  const hayAnterior = pagina > 1;
  const haySiguiente = pagina * POR_PAGINA_MOROSIDAD < total;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Morosidad de Unidades</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Morosidad — Administración
        </p>
      </div>

      <section
        aria-label="Métricas de morosidad"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <div className="rounded-xl border border-zinc-300 bg-background p-5 dark:border-zinc-800">
          <h2 className="text-sm text-zinc-600 dark:text-zinc-400">
            Total en Mora
          </h2>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {formatUsd(totalMora)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Suma de saldos vencidos
          </p>
        </div>

        <div className="rounded-xl border border-zinc-300 bg-background p-5 dark:border-zinc-800">
          <h2 className="text-sm text-zinc-600 dark:text-zinc-400">
            Unidades Morosas
          </h2>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {unidadesMorosas}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Con cuotas vencidas activas
          </p>
        </div>
      </section>

      <FiltrosMorosidadForm torreId={filtros.torreId} />

      {datos.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 py-10 text-center dark:border-zinc-800">
          <p className="text-zinc-600 dark:text-zinc-400">
            No hay unidades morosas
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-zinc-300 dark:border-zinc-800">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                <tr>
                  <th className="border-r border-zinc-300 px-4 py-2.5 font-semibold dark:border-zinc-800">
                    Unidad
                  </th>
                  <th className="border-r border-zinc-300 px-4 py-2.5 font-semibold dark:border-zinc-800">
                    Cuotas Vencidas
                  </th>
                  <th className="border-r border-zinc-300 px-4 py-2.5 font-semibold dark:border-zinc-800">
                    Monto Adeudado
                  </th>
                  <th className="px-4 py-2.5 font-semibold">
                    Vencida Más Antigua
                  </th>
                </tr>
              </thead>
              <tbody>
                {datos.map((fila) => (
                  <tr
                    key={fila.unidad}
                    className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800"
                  >
                    <td className="border-r border-zinc-200 px-4 py-2.5 font-medium dark:border-zinc-800">
                      {fila.unidad}
                    </td>
                    <td className="border-r border-zinc-200 px-4 py-2.5 tabular-nums dark:border-zinc-800">
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-300">
                        {fila.cuotasVencidas}
                      </span>
                    </td>
                    <td className="border-r border-zinc-200 px-4 py-2.5 tabular-nums dark:border-zinc-800">
                      {formatUsd(fila.montoAdeudado)}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">
                      {formatFecha(fila.vencidaMasAntigua)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > POR_PAGINA_MOROSIDAD && (
            <nav
              aria-label="Paginación"
              className="flex flex-wrap items-center justify-between gap-3 text-sm"
            >
              <span className="text-zinc-600 dark:text-zinc-400">
                Mostrando {desdeN}–{hastaN} de {total} · {POR_PAGINA_MOROSIDAD}{" "}
                por página
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