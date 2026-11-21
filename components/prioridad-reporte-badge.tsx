import { PRIORIDAD_REPORTE_LABEL } from "@/lib/reportes-ui";
import type { PrioridadReporte } from "@/lib/types/reportes";

const CLASES: Record<PrioridadReporte, string> = {
  ALTA: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  MEDIA: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  BAJA: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
};

export function PrioridadReporteBadge({
  prioridad,
}: {
  prioridad: PrioridadReporte | null;
}) {
  if (!prioridad) {
    return (
      <span className="inline-block rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        Sin asignar
      </span>
    );
  }

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CLASES[prioridad] ?? "bg-zinc-100 text-zinc-800"}`}
    >
      {PRIORIDAD_REPORTE_LABEL[prioridad] ?? prioridad}
    </span>
  );
}