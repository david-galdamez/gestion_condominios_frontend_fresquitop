import type { CategoriaReporte, EstadoReporte } from "@/lib/types/reportes";

export const CATEGORIA_LABEL: Record<CategoriaReporte, string> = {
  FUGA: "Fuga",
  LUMINARIA: "Luminaria",
  ASCENSOR: "Ascensor",
  LIMPIEZA: "Limpieza",
  OTRO: "Otro",
};

export const ESTADO_REPORTE_LABEL: Record<EstadoReporte, string> = {
  ABIERTO: "Abierto",
  EN_PROCESO: "En proceso",
  RESUELTO: "Resuelto",
};

// Los reportes traen un instante (ISO con hora), no una fecha de calendario:
// se muestra en la zona horaria de El Salvador para que no se corra de día.
const ZONA = "America/El_Salvador";

export function formatFechaCorta(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "short",
    timeZone: ZONA,
  }).format(d);
}

export function formatFechaHora(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: ZONA,
  }).format(d);
}
