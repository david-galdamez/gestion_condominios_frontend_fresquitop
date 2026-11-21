import { fechaEnRango } from "@/lib/format";

// Validadores puros: se usan igual en el formulario (cliente) y en la Server
// Action, así ambos lados coinciden en reglas y mensajes.

export const DIAS_MAX_VISITA = 30;

export const MSG = {
  fecha: "Elige una fecha entre hoy y los próximos 30 días",
  documento: "El número de documento no tiene el formato correcto",
  nombre: "El nombre debe tener entre 3 y 60 caracteres",
  placa: "La placa no puede superar los 10 caracteres",
  hora: "Ingresa una hora válida",
  unidad: "Selecciona una unidad",
} as const;

export type CamposVisita = {
  unidadId: string;
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  placa: string;
  fechaVisita: string;
  horaEstimada: string;
};

export type ErroresVisita = Partial<Record<keyof CamposVisita, string>>;

const DUI = /^\d{8}-\d$/;
const PASAPORTE = /^[A-Z0-9]{6,12}$/;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export const validarNombre = (v: string) =>
  v.trim().length >= 3 && v.trim().length <= 60 ? undefined : MSG.nombre;

export function validarDocumento(tipo: string, numero: string) {
  const n = numero.trim();
  if (tipo === "DUI") return DUI.test(n) ? undefined : MSG.documento;
  if (tipo === "PASAPORTE")
    return PASAPORTE.test(n.toUpperCase()) ? undefined : MSG.documento;
  return MSG.documento;
}

export const validarPlaca = (v: string) =>
  v.trim().length <= 10 ? undefined : MSG.placa;

export const validarHora = (v: string) => (HORA.test(v) ? undefined : MSG.hora);

export const validarFecha = (v: string, hoy: string) =>
  fechaEnRango(v, hoy, DIAS_MAX_VISITA) ? undefined : MSG.fecha;

export const validarUnidad = (v: string) => (v ? undefined : MSG.unidad);

// Devuelve solo los campos con error; un objeto vacío significa válido.
export function validarVisita(c: CamposVisita, hoy: string): ErroresVisita {
  const todos: ErroresVisita = {
    unidadId: validarUnidad(c.unidadId),
    nombre: validarNombre(c.nombre),
    numeroDocumento: validarDocumento(c.tipoDocumento, c.numeroDocumento),
    placa: validarPlaca(c.placa),
    fechaVisita: validarFecha(c.fechaVisita, hoy),
    horaEstimada: validarHora(c.horaEstimada),
  };
  return Object.fromEntries(
    Object.entries(todos).filter(([, v]) => v !== undefined),
  ) as ErroresVisita;
}

// Deja solo dígitos (máx. 9) y pone el guion antes del último dígito.
export function mascaraDui(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 9);
  return d.length === 9 ? `${d.slice(0, 8)}-${d[8]}` : d;
}
