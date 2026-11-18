// Validadores puros compartidos por el formulario y la Server Action.

export const CATEGORIAS = [
  { valor: "AGUA", etiqueta: "Agua" },
  { valor: "ELECTRICIDAD", etiqueta: "Electricidad" },
  { valor: "MANTENIMIENTO", etiqueta: "Mantenimiento" },
  { valor: "SEGURIDAD", etiqueta: "Seguridad" },
  { valor: "AVISO_GENERAL", etiqueta: "Aviso general" },
] as const;

export const MSG = {
  titulo: "El título debe tener entre 5 y 100 caracteres",
  contenido: "El contenido debe tener entre 10 y 2000 caracteres",
  categoria: "Selecciona una categoría",
  destino: "Selecciona los destinatarios",
  fecha: "La fecha no es válida",
  expiracion: "La expiración debe ser posterior a la publicación",
} as const;

export type CamposComunicado = {
  titulo: string;
  contenido: string;
  categoria: string;
  // "todos" o "torres"
  destino: string;
  torreIds: string[];
  // datetime-local "YYYY-MM-DDTHH:mm" en hora de El Salvador.
  fechaPublicacion: string;
  fechaExpiracion: string;
};

export type ErroresComunicado = Partial<
  Record<Exclude<keyof CamposComunicado, "torreIds">, string>
>;

const FECHA_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

// El Salvador no tiene horario de verano: siempre UTC-6.
export const aIsoSv = (local: string) =>
  new Date(`${local}:00-06:00`).toISOString();

// Instante -> "YYYY-MM-DDTHH:mm" en hora de El Salvador (para datetime-local).
export const aLocalSv = (fecha: Date) =>
  new Date(fecha.getTime() - 6 * 3_600_000).toISOString().slice(0, 16);

export function validarComunicado(c: CamposComunicado): ErroresComunicado {
  const t = c.titulo.trim().length;
  const n = c.contenido.trim().length;
  const pub = c.fechaPublicacion;
  const exp = c.fechaExpiracion;
  const todos: ErroresComunicado = {
    titulo: t >= 5 && t <= 100 ? undefined : MSG.titulo,
    contenido: n >= 10 && n <= 2000 ? undefined : MSG.contenido,
    categoria: CATEGORIAS.some((x) => x.valor === c.categoria)
      ? undefined
      : MSG.categoria,
    destino:
      c.destino === "todos" || (c.destino === "torres" && c.torreIds.length > 0)
        ? undefined
        : MSG.destino,
    fechaPublicacion: !pub || FECHA_HORA.test(pub) ? undefined : MSG.fecha,
    fechaExpiracion: !exp
      ? undefined
      : !FECHA_HORA.test(exp)
        ? MSG.fecha
        : pub && exp <= pub
          ? MSG.expiracion
          : undefined,
  };
  return Object.fromEntries(
    Object.entries(todos).filter(([, v]) => v !== undefined),
  ) as ErroresComunicado;
}

// Coloca los mensajes de la API en su campo; el resto va arriba del formulario.
export function erroresDesdeApi(messages: string[]) {
  const porMensaje: Record<string, keyof ErroresComunicado> = {
    [MSG.titulo]: "titulo",
    [MSG.contenido]: "contenido",
    [MSG.categoria]: "categoria",
    [MSG.destino]: "destino",
    [MSG.expiracion]: "fechaExpiracion",
  };
  const errores: ErroresComunicado = {};
  const resto: string[] = [];
  for (const m of messages) {
    const k = porMensaje[m];
    if (k) errores[k] = m;
    else resto.push(m);
  }
  return { errores, resto };
}
