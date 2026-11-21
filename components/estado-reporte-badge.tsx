import { ESTADO_REPORTE_LABEL } from "@/lib/reportes-ui";
import type { EstadoReporte } from "@/lib/types/reportes";

const CLASES: Record<EstadoReporte, string> = {
  ABIERTO: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  EN_PROCESO: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  RESUELTO:
    "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
};

export function EstadoReporteBadge({ estado }: { estado: EstadoReporte }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CLASES[estado] ?? "bg-zinc-100 text-zinc-800"}`}
    >
      {ESTADO_REPORTE_LABEL[estado] ?? estado}
    </span>
  );
}
