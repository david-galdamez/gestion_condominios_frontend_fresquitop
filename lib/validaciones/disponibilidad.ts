import { esFechaValida, fechaEnRango, sumarDias } from "@/lib/format";
import type { Area } from "@/lib/types/areas";
import type { AreaDisponibilidad } from "@/lib/types/disponibilidad";
import { horasDelArea } from "@/lib/validaciones/reserva";

// Funciones puras de H23: se usan en la página (servidor) y en la vista
// (cliente) para que ambos lados apliquen el mismo rango y los mismos textos.

export const DIAS_DISPONIBILIDAD = 30;

export const MSG_DISPONIBILIDAD = {
  fueraDeRango: "Elige una fecha entre hoy y los próximos 30 días",
  sinHorarios: "No hay horarios libres para esta fecha",
  sinAreas: "No hay áreas disponibles para reservar",
  error: "No pudimos cargar la disponibilidad. Intenta de nuevo.",
  sinPermiso: "No tienes permiso para esta acción",
} as const;

export const fechaMaxima = (hoy: string) => sumarDias(hoy, DIAS_DISPONIBILIDAD);

export const fechaConsultable = (fecha: string, hoy: string) =>
  fechaEnRango(fecha, hoy, DIAS_DISPONIBILIDAD);

// "" o un id que ya no está en la lista equivalen a "Todas".
export function filtrarAreas(areas: AreaDisponibilidad[], areaId: string) {
  return areas.some((a) => a.id === areaId)
    ? areas.filter((a) => a.id === areaId)
    : areas;
}

export const hayLibres = (areas: AreaDisponibilidad[]) =>
  areas.some((a) => a.bloques.some((b) => b.estado === "LIBRE"));

// FE-23.2: el bloque elegido viaja al formulario de reserva (H04) por la URL.
export function enlaceReserva(areaId: string, fecha: string, horaInicio: string) {
  const qs = new URLSearchParams({ areaId, fecha, horaInicio });
  return `/reservas/nueva?${qs.toString()}`;
}

export function enlaceDisponibilidad(fecha: string, areaId: string) {
  const qs = new URLSearchParams({ fecha });
  if (areaId) qs.set("areaId", areaId);
  return `/reservas/disponibilidad?${qs.toString()}`;
}

export type Prellenado = { areaId?: string; fecha?: string; horaInicio?: string };

const texto = (v: string | string[] | undefined) =>
  typeof v === "string" ? v : undefined;

// Lee los parámetros que deja la disponibilidad en /reservas/nueva. Solo se
// aceptan valores que el formulario puede mostrar: un área de la lista, una
// fecha real no pasada y una hora de inicio dentro del horario de esa área.
export function prellenadoDesdeParams(
  params: Record<string, string | string[] | undefined>,
  areas: Area[],
  hoy: string,
): Prellenado {
  const area = areas.find((a) => a.id === texto(params.areaId));
  if (!area) return {};
  const fecha = texto(params.fecha);
  const fechaOk = fecha && esFechaValida(fecha) && fecha >= hoy ? fecha : undefined;
  const hora = texto(params.horaInicio);
  const horaOk = hora && horasDelArea(area).inicios.includes(hora) ? hora : undefined;
  return { areaId: area.id, fecha: fechaOk, horaInicio: horaOk };
}
