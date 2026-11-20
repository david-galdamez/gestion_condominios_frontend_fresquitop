const fmt = new Intl.NumberFormat("es-SV", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const formatPorcentaje = (n: number) => `${fmt.format(n)} %`;

// Variación contra el periodo anterior: flecha y porcentaje, o
// "Sin base de comparación" cuando el periodo anterior valía 0.
export function Variacion({
  cambio,
  menosEsMejor = false,
}: {
  cambio: number | null | undefined;
  // En incidencias bajar es bueno; en ocupación subir es bueno.
  menosEsMejor?: boolean;
}) {
  if (cambio === null || cambio === undefined) {
    return (
      <span className="text-xs text-zinc-500">Sin base de comparación</span>
    );
  }
  if (cambio === 0) {
    return <span className="text-xs text-zinc-500">{formatPorcentaje(0)} vs. periodo anterior</span>;
  }
  const sube = cambio > 0;
  const bueno = sube !== menosEsMejor;
  return (
    <span
      className={`text-xs font-medium ${
        bueno
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-red-700 dark:text-red-400"
      }`}
    >
      <span aria-hidden="true">{sube ? "▲" : "▼"}</span>{" "}
      {formatPorcentaje(Math.abs(cambio))}
      <span className="sr-only">
        {sube ? " más" : " menos"} que el periodo anterior
      </span>
      <span aria-hidden="true" className="font-normal text-zinc-500">
        {" "}
        vs. periodo anterior
      </span>
    </span>
  );
}
