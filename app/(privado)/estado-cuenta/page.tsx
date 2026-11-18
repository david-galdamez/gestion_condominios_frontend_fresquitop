import type { Metadata } from "next";
import Link from "next/link";
import { EstadoCuotaBadge } from "@/components/estado-cuota-badge";
import { requireRol } from "@/lib/auth";
import { getEstadoCuenta } from "@/lib/estado-cuenta";
import { formatFecha, formatPeriodo, formatUsd } from "@/lib/format";
import type { EstadoCuentaFiltros } from "@/lib/types/estado-cuenta";
import { FiltrosForm } from "./filtros-form";
import { leerFiltros, type SearchParams } from "./leer-filtros";
import { ReintentarButton } from "./reintentar-button";

export const metadata: Metadata = { title: "Estado de cuenta" };

function hrefPagina(filtros: EstadoCuentaFiltros, pagina: number) {
  const q = new URLSearchParams();
  if (filtros.unidadId) q.set("unidadId", filtros.unidadId);
  if (filtros.estado) q.set("estado", filtros.estado);
  if (filtros.desde) q.set("desde", filtros.desde);
  if (filtros.hasta) q.set("hasta", filtros.hasta);
  q.set("pagina", String(pagina));
  return `/estado-cuenta?${q.toString()}`;
}

const btnPag =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700";
const btnPagOff = `${btnPag} cursor-not-allowed opacity-50`;

export default async function EstadoCuentaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRol("RESIDENTE");
  const filtros = leerFiltros(await searchParams);
  const r = await getEstadoCuenta(filtros);

  // Sin datos ni saldo en 403 ni en error.
  if (r.status === "forbidden") {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Estado de cuenta</h1>
        <p role="alert">No tienes permiso para esta acción</p>
      </div>
    );
  }

  if (r.status === "error") {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Estado de cuenta</h1>
        <p role="alert">
          No pudimos cargar tu estado de cuenta. Intenta de nuevo.
        </p>
        <ReintentarButton />
      </div>
    );
  }

  if (r.status === "bad_request") {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Estado de cuenta</h1>
        <p role="alert" className="text-sm text-red-600">
          {r.message}
        </p>
        <FiltrosForm unidades={[]} unidadId={filtros.unidadId} />
      </div>
    );
  }

  const { unidad, unidades, saldoTotal, datos, total, pagina, porPagina } =
    r.data;
  const unidadId = unidad?.id ?? filtros.unidadId;
  const desdeN = (pagina - 1) * porPagina + 1;
  const hastaN = (pagina - 1) * porPagina + datos.length;
  const hayAnterior = pagina > 1;
  const haySiguiente = pagina * porPagina < total;
  const filtrosPag = { ...filtros, unidadId };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Estado de cuenta</h1>
        {unidades.length === 1 && unidad && (
          <p className="text-zinc-600 dark:text-zinc-400">
            Unidad {unidad.codigo}
          </p>
        )}
      </div>

      <section className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="text-sm text-zinc-600 dark:text-zinc-400">
          Saldo total
        </h2>
        <p className="text-3xl font-semibold">{formatUsd(saldoTotal)}</p>
        <p className="mt-1 text-xs text-zinc-500">
          Suma de cuotas pendientes y vencidas, sin recargo por mora
        </p>
        {saldoTotal > 0 && unidad && (
          <Link
            href={`/pagos/nuevo?unidadId=${unidad.id}`}
            className="mt-4 inline-block rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Pagar cuotas
          </Link>
        )}
      </section>

      <FiltrosForm unidades={unidades} unidadId={unidadId} />

      {datos.length === 0 ? (
        <p className="py-8 text-center text-zinc-600 dark:text-zinc-400">
          No hay cuotas para el periodo seleccionado
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="py-2 pr-4 font-medium">Periodo</th>
                  <th className="py-2 pr-4 text-right font-medium">Monto</th>
                  <th className="py-2 pr-4 font-medium">Vence</th>
                  <th className="py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {datos.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-zinc-100 dark:border-zinc-900"
                  >
                    <td className="py-2 pr-4">{formatPeriodo(c.periodo)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {formatUsd(c.monto)}
                    </td>
                    <td className="py-2 pr-4 tabular-nums">
                      {formatFecha(c.fechaVencimiento)}
                    </td>
                    <td className="py-2">
                      <EstadoCuotaBadge estado={c.estado} />
                      {c.estado !== "PAGADA" && unidad && (
                        <Link
                          href={`/pagos/nuevo?unidadId=${unidad.id}&cuota=${c.id}`}
                          className="ml-3 text-xs underline"
                        >
                          Pagar
                        </Link>
                      )}
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
                <Link href={hrefPagina(filtrosPag, pagina - 1)} className={btnPag}>
                  Anterior
                </Link>
              ) : (
                <span aria-disabled="true" className={btnPagOff}>
                  Anterior
                </span>
              )}
              {haySiguiente ? (
                <Link href={hrefPagina(filtrosPag, pagina + 1)} className={btnPag}>
                  Siguiente
                </Link>
              ) : (
                <span aria-disabled="true" className={btnPagOff}>
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
