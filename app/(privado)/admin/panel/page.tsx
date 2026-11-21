import type { Metadata } from "next";
import { requireRol } from "@/lib/auth";
import { formatFecha, formatUsd } from "@/lib/format";
import { getPanel } from "@/lib/panel";
import { resolverPeriodo, type SearchParamsPanel } from "@/lib/panel-periodo";
import { ExportarReporte } from "./exportar-reporte";
import { ReintentarButton } from "./reintentar-button";
import { SelectorPeriodo } from "./selector-periodo";
import { formatPorcentaje, Variacion } from "./variacion";

export const metadata: Metadata = { title: "Panel del Condominio" };

const tarjeta =
  "rounded-xl border border-zinc-300 bg-background p-5 dark:border-zinc-800";
const tituloTarjeta = "text-sm text-zinc-600 dark:text-zinc-400";

const PRIORIDADES = [
  { clave: "ALTA", etiqueta: "Alta" },
  { clave: "MEDIA", etiqueta: "Media" },
  { clave: "BAJA", etiqueta: "Baja" },
  { clave: "SIN_ASIGNAR", etiqueta: "Sin asignar" },
] as const;

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsPanel>;
}) {
  await requireRol("ADMINISTRADOR");
  const periodo = resolverPeriodo(await searchParams);

  const descripcion = `Del ${formatFecha(periodo.desde)} al ${formatFecha(periodo.hasta)}`;

  // H20: el botón Exportar usa exactamente el periodo de la pantalla; sin un
  // periodo válido queda deshabilitado ("Selecciona un periodo").
  const encabezado = (periodoValido: boolean) => (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Panel del Condominio</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {periodo.error ? "Elige un periodo para ver los indicadores." : descripcion}
        </p>
      </div>
      <ExportarReporte
        periodo={periodoValido ? { desde: periodo.desde, hasta: periodo.hasta } : null}
        descripcion={descripcion.toLowerCase()}
      />
    </div>
  );

  const selector = (
    <SelectorPeriodo
      periodo={periodo.periodo}
      desde={periodo.desde}
      hasta={periodo.hasta}
    />
  );

  if (periodo.error) {
    return (
      <div className="flex flex-col gap-4">
        {encabezado(false)}
        {selector}
        <p role="alert" className="text-sm text-red-600">
          {periodo.error}
        </p>
      </div>
    );
  }

  const r = await getPanel(periodo);

  if (r.status === "forbidden") {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Panel del Condominio</h1>
        <p role="alert">No tienes permiso para esta acción</p>
      </div>
    );
  }

  if (r.status === "error") {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Panel del Condominio</h1>
        <p role="alert">
          No pudimos cargar el panel del condominio. Intenta de nuevo.
        </p>
        <ReintentarButton />
      </div>
    );
  }

  if (r.status === "bad_request") {
    return (
      <div className="flex flex-col gap-4">
        {encabezado(false)}
        {selector}
        <p role="alert" className="text-sm text-red-600">
          {r.message}
        </p>
      </div>
    );
  }

  const { mora, ocupacion, areaMasUsada, incidencias, participacion } = r.data;
  const totalIncidencias =
    incidencias.ALTA +
    incidencias.MEDIA +
    incidencias.BAJA +
    incidencias.SIN_ASIGNAR;

  return (
    <div className="flex flex-col gap-6">
      {encabezado(true)}
      {selector}

      <section
        aria-label="Indicadores principales"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <div className={tarjeta}>
          <h2 className={tituloTarjeta}>Monto en mora</h2>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {formatUsd(mora.monto)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Cuotas vencidas al día de hoy
          </p>
        </div>

        <div className={tarjeta}>
          <h2 className={tituloTarjeta}>Unidades morosas</h2>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {formatPorcentaje(mora.porcentajeMorosas)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {mora.unidadesMorosas}{" "}
            {mora.unidadesMorosas === 1 ? "unidad" : "unidades"} con cuotas
            vencidas
          </p>
        </div>

        <div className={tarjeta}>
          <h2 className={tituloTarjeta}>Incidencias abiertas</h2>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {totalIncidencias}
          </p>
          <div className="mt-1">
            <Variacion cambio={incidencias.cambio} menosEsMejor />
          </div>
        </div>
      </section>

      <section aria-label="Ocupación de áreas comunes" className={tarjeta}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Ocupación de áreas comunes</h2>
          {areaMasUsada && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Más usada: <strong>{areaMasUsada}</strong>
            </p>
          )}
        </div>
        {ocupacion.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            No hay áreas comunes activas.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {ocupacion.map((a) => (
              <li key={a.area} className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium">
                    {a.area}
                    {a.area === areaMasUsada && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Más usada
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums">
                    {formatPorcentaje(a.porcentaje)}
                  </span>
                </div>
                <div
                  role="img"
                  aria-label={`${a.area}: ${formatPorcentaje(a.porcentaje)} de ocupación`}
                  className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
                >
                  <div
                    className="h-full rounded-full bg-sky-600"
                    style={{ width: `${Math.min(a.porcentaje, 100)}%` }}
                  />
                </div>
                <Variacion cambio={a.cambio} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Incidencias por prioridad" className={tarjeta}>
        <h2 className="text-lg font-semibold">Incidencias por prioridad</h2>
        <p className="text-xs text-zinc-500">
          Reportes abiertos y en proceso creados en el periodo
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {PRIORIDADES.map((p) => (
            <div key={p.clave}>
              <dt className={tituloTarjeta}>{p.etiqueta}</dt>
              <dd className="text-2xl font-bold tabular-nums">
                {incidencias[p.clave]}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-label="Participación en asambleas" className={tarjeta}>
        <h2 className="text-lg font-semibold">Participación en asambleas</h2>
        <p className="text-xs text-zinc-500">
          Últimas 3 asambleas cerradas en el periodo
        </p>
        {participacion.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            No hubo asambleas cerradas en este periodo.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-300 dark:border-zinc-800">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-zinc-300 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Asamblea</th>
                  <th className="px-4 py-2.5 font-semibold">Participación</th>
                </tr>
              </thead>
              <tbody>
                {participacion.map((p) => (
                  <tr
                    key={p.asamblea}
                    className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800"
                  >
                    <td className="px-4 py-2.5 font-medium">{p.asamblea}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div
                          role="img"
                          aria-label={`${formatPorcentaje(p.porcentaje)} de participación`}
                          className="h-2.5 w-32 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
                        >
                          <div
                            className="h-full rounded-full bg-emerald-600"
                            style={{ width: `${Math.min(p.porcentaje, 100)}%` }}
                          />
                        </div>
                        <span className="tabular-nums">
                          {formatPorcentaje(p.porcentaje)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
