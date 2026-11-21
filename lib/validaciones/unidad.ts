export const MSG = {
  torre: "Selecciona una torre",
  codigo: "El código es obligatorio (máximo 20 caracteres)",
  duplicado: "Ya existe una unidad con ese código",
} as const;

export type CamposUnidad = { torreId: string; codigo: string };
export type ErroresUnidad = Partial<Record<keyof CamposUnidad, string>>;

export const validarTorre = (v: string) => (v.trim() ? undefined : MSG.torre);

export const validarCodigo = (v: string) =>
  v.trim().length >= 1 && v.trim().length <= 20 ? undefined : MSG.codigo;

export function validarUnidad(c: CamposUnidad): ErroresUnidad {
  const todos: ErroresUnidad = {
    torreId: validarTorre(c.torreId),
    codigo: validarCodigo(c.codigo),
  };
  return Object.fromEntries(
    Object.entries(todos).filter(([, v]) => v !== undefined),
  ) as ErroresUnidad;
}

// Ubica bajo su campo los mensajes 400 del backend que reconoce.
export function erroresDesdeApi(messages: string[]) {
  const errores: ErroresUnidad = {};
  const resto: string[] = [];
  for (const m of messages) {
    if (/torre/i.test(m)) errores.torreId = m;
    else if (/código|codigo/i.test(m)) errores.codigo = MSG.codigo;
    else resto.push(m);
  }
  return { errores, resto };
}
