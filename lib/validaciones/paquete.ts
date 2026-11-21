import type { Mensajeria } from "@/lib/types/paquetes";

// Validadores puros: se usan igual en el formulario (cliente) y en la Server
// Action. Los mensajes son los mismos que devuelve el backend (H09).

export const MSG = {
  unidad: "Selecciona una unidad",
  destinatario: "El destinatario debe tener entre 3 y 60 caracteres",
  mensajeria: "Elige una mensajería de la lista",
  guia: "El número de guía no puede superar los 40 caracteres",
  foto: "Solo JPG o PNG de hasta 5 MB",
  sinResidentes: "La unidad no tiene residentes registrados",
  unidadNoExiste: "La unidad no existe",
} as const;

export const MAX_FOTO_BYTES = 5 * 1024 * 1024;
export const TIPOS_FOTO = ["image/jpeg", "image/png"];

export const MENSAJERIAS: { valor: Mensajeria; etiqueta: string }[] = [
  { valor: "CORREOS", etiqueta: "Correos" },
  { valor: "DHL", etiqueta: "DHL" },
  { valor: "FEDEX", etiqueta: "FedEx" },
  { valor: "UPS", etiqueta: "UPS" },
  { valor: "AMAZON", etiqueta: "Amazon" },
  { valor: "OTRA", etiqueta: "Otra" },
];

export const etiquetaMensajeria = (m: string) =>
  MENSAJERIAS.find((x) => x.valor === m)?.etiqueta ?? m;

export type CamposPaquete = {
  unidadId: string;
  destinatario: string;
  mensajeria: string;
  guia: string;
};

export type ErroresPaquete = Partial<Record<keyof CamposPaquete | "foto", string>>;

// Lo mínimo que se mira de la foto (File en el navegador y en la acción).
export type FotoInfo = { type: string; size: number };

export const validarUnidad = (v: string) => (v ? undefined : MSG.unidad);

export const validarDestinatario = (v: string) =>
  v.trim().length >= 3 && v.trim().length <= 60 ? undefined : MSG.destinatario;

export const validarMensajeria = (v: string) =>
  MENSAJERIAS.some((m) => m.valor === v) ? undefined : MSG.mensajeria;

export const validarGuia = (v: string) =>
  v.trim().length <= 40 ? undefined : MSG.guia;

// El backend además revisa los primeros bytes del archivo; acá basta el tipo.
export const validarFoto = (f: FotoInfo | null | undefined) =>
  f && f.size > 0 && f.size <= MAX_FOTO_BYTES && TIPOS_FOTO.includes(f.type)
    ? undefined
    : MSG.foto;

// Devuelve solo los campos con error; un objeto vacío significa válido.
export function validarPaquete(
  c: CamposPaquete,
  foto: FotoInfo | null | undefined,
): ErroresPaquete {
  const todos: ErroresPaquete = {
    unidadId: validarUnidad(c.unidadId),
    destinatario: validarDestinatario(c.destinatario),
    mensajeria: validarMensajeria(c.mensajeria),
    guia: validarGuia(c.guia),
    foto: validarFoto(foto),
  };
  return Object.fromEntries(
    Object.entries(todos).filter(([, v]) => v !== undefined),
  ) as ErroresPaquete;
}

// Ubica bajo su campo los mensajes 400 del backend que reconoce; el resto se
// muestra arriba del formulario.
const CAMPO_DE_MENSAJE: Record<string, keyof ErroresPaquete> = {
  [MSG.unidad]: "unidadId",
  [MSG.destinatario]: "destinatario",
  [MSG.mensajeria]: "mensajeria",
  [MSG.guia]: "guia",
  [MSG.foto]: "foto",
};

export function erroresDesdeApi(messages: string[]) {
  const errores: ErroresPaquete = {};
  const resto: string[] = [];
  for (const m of messages) {
    const campo = CAMPO_DE_MENSAJE[m];
    if (campo) errores[campo] = m;
    else resto.push(m);
  }
  return { errores, resto };
}
