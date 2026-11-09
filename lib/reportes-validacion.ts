// Reglas de H05 compartidas por el formulario (cliente) y sus pruebas. Los
// mensajes son idénticos a los del backend para que se vean igual venga el
// error del navegador o de la API.

export const TITULO_MIN = 5;
export const TITULO_MAX = 80;
export const DESCRIPCION_MIN = 10;
export const DESCRIPCION_MAX = 500;
export const MAX_FOTOS = 5;
export const MAX_FOTO_BYTES = 5 * 1024 * 1024;
export const TIPOS_FOTO = ["image/jpeg", "image/png"];

export const MENSAJE_TITULO = `El título debe tener entre ${TITULO_MIN} y ${TITULO_MAX} caracteres`;
export const MENSAJE_DESCRIPCION = `La descripción debe tener entre ${DESCRIPCION_MIN} y ${DESCRIPCION_MAX} caracteres`;
export const MENSAJE_FOTOS = "Solo JPG o PNG de hasta 5 MB, máximo 5 fotos";

export type CamposReporte = {
  titulo: string;
  categoria: string;
  ubicacion: string;
  descripcion: string;
};

export type ErroresCampos = Partial<Record<keyof CamposReporte, string>>;

export function validarCampos(c: CamposReporte): ErroresCampos {
  const errores: ErroresCampos = {};

  const titulo = c.titulo.trim().length;
  if (titulo < TITULO_MIN || titulo > TITULO_MAX) errores.titulo = MENSAJE_TITULO;

  if (!c.categoria) errores.categoria = "Selecciona una categoría";
  if (!c.ubicacion) errores.ubicacion = "Selecciona una ubicación";

  const descripcion = c.descripcion.trim().length;
  if (descripcion < DESCRIPCION_MIN || descripcion > DESCRIPCION_MAX) {
    errores.descripcion = MENSAJE_DESCRIPCION;
  }

  return errores;
}

// Devuelve el mensaje de error si la foto no se puede adjuntar, o null si sí.
// `cantidadActual` es cuántas fotos hay ya adjuntas.
export function validarFoto(
  foto: { type: string; size: number },
  cantidadActual: number,
): string | null {
  if (
    cantidadActual >= MAX_FOTOS ||
    !TIPOS_FOTO.includes(foto.type) ||
    foto.size > MAX_FOTO_BYTES
  ) {
    return MENSAJE_FOTOS;
  }
  return null;
}
