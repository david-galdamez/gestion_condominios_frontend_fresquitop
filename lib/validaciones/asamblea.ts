export const MSG = {
  titulo: 'El titulo debe tener entre 5 y 100 caracteres',
  descripcion: 'La descripcion no puede superar los 1000 caracteres',
  fecha: 'La fecha no es valida',
  cierre: 'El cierre debe ser al menos 1 hora despues de la apertura',
  publicar: 'Publica con al menos 48 horas de anticipacion',
  temaTitulo: 'El titulo del tema no puede estar vacio (max. 150)',
  opciones: 'Cada tema debe tener entre 2 y 10 opciones',
} as const;

export type CamposAsamblea = { titulo: string; descripcion: string; fechaApertura: string; fechaCierre: string; };
export type ErroresAsamblea = Partial<Record<keyof CamposAsamblea | 'temas' | 'cierre' | 'fecha', string>>;

export const aIsoSv = (local: string) => new Date(`${local}:00-06:00`).toISOString();
export const aLocalSv = (fecha: Date) => new Date(fecha.getTime() - 6 * 3_600_000).toISOString().slice(0, 16);

export function validarAsamblea(campos: CamposAsamblea, temas: { titulo: string; opciones: { texto: string }[] }[]): ErroresAsamblea {
  const errores: ErroresAsamblea = {};
  const t = campos.titulo.trim().length;
  if (t < 5 || t > 100) errores.titulo = MSG.titulo;
  if (campos.descripcion.trim().length > 1000) errores.descripcion = MSG.descripcion;
  if (!campos.fechaApertura || !campos.fechaCierre) errores.fecha = MSG.fecha;
  else {
    const ap = new Date(campos.fechaApertura).getTime();
    const ci = new Date(campos.fechaCierre).getTime();
    if (ci < ap + 3_600_000) errores.cierre = MSG.cierre;
  }
  if (temas.length < 1 || temas.length > 10) errores.temas = 'Debe haber entre 1 y 10 temas';
  else {
    for (const tema of temas) {
      if (!tema.titulo.trim() || tema.titulo.trim().length > 150) { errores.temas = MSG.temaTitulo; break; }
      if (tema.opciones.length < 2 || tema.opciones.length > 10 || tema.opciones.some((o) => !o.texto.trim() || o.texto.trim().length > 100)) { errores.temas = MSG.opciones; break; }
    }
  }
  return errores;
}