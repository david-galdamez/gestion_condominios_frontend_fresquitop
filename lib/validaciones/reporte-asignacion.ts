import {
  PRIORIDADES_REPORTE,
  type PrioridadReporte,
} from "@/lib/types/reportes";

export const RESPONSABLE_MIN = 3;
export const RESPONSABLE_MAX = 60;

export const MSG_ASIGNACION = {
  incompleta: "Asigna prioridad y responsable juntos",
  prioridadInvalida: "La prioridad debe ser Alta, Media o Baja",
  responsableLongitud: `El responsable debe tener entre ${RESPONSABLE_MIN} y ${RESPONSABLE_MAX} caracteres`,
  guardado: "Asignación guardada",
  errorGenerico: "No pudimos guardar. Intenta de nuevo.",
  sinPermiso: "No tienes permiso para esta acción",
} as const;

export type CamposAsignacion = {
  prioridad: string;
  responsable: string;
};

export function esPrioridadValida(v: string): v is PrioridadReporte {
  return (PRIORIDADES_REPORTE as readonly string[]).includes(v);
}

/**
 * Devuelve el mensaje de error si los campos de asignación no son válidos,
 * o null si cumplen todas las reglas de H06.
 */
export function validarAsignacionReporte(
  campos: CamposAsignacion,
): string | null {
  const prioridad = campos.prioridad.trim();
  const responsable = campos.responsable.trim();

  if (!prioridad || !responsable) {
    return MSG_ASIGNACION.incompleta;
  }

  if (!esPrioridadValida(prioridad)) {
    return MSG_ASIGNACION.prioridadInvalida;
  }

  if (
    responsable.length < RESPONSABLE_MIN ||
    responsable.length > RESPONSABLE_MAX
  ) {
    return MSG_ASIGNACION.responsableLongitud;
  }

  return null;
}