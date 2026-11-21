export const COMENTARIO_CIERRE_MIN = 10;
export const COMENTARIO_CIERRE_MAX = 300;

export const MSG_RESOLUCION = {
  comentarioLongitud: `El comentario debe tener entre ${COMENTARIO_CIERRE_MIN} y ${COMENTARIO_CIERRE_MAX} caracteres`,
  resuelto: "Reporte marcado como Resuelto",
  soloEnProceso: "Solo se pueden resolver reportes En proceso",
  noEncontrado: "Reporte no encontrado",
  sinPermiso: "No tienes permiso para esta acción",
  errorGenerico: "No pudimos actualizar el reporte. Intenta de nuevo.",
  notaResueltoResidente:
    "Este reporte está resuelto y no se puede reabrir; si el problema persiste, crea un nuevo reporte.",
} as const;

/**
 * Devuelve el mensaje de error si el comentario de cierre está fuera del rango
 * permitido (10 a 300 caracteres), o null si es válido.
 */
export function validarComentarioCierre(comentario: string): string | null {
  const limpio = comentario.trim();
  if (
    limpio.length < COMENTARIO_CIERRE_MIN ||
    limpio.length > COMENTARIO_CIERRE_MAX
  ) {
    return MSG_RESOLUCION.comentarioLongitud;
  }
  return null;
}