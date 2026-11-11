import type { EntradaSinCodigo } from "@/lib/types/accesos";
import type { TipoDocumento } from "@/lib/types/visitas";
import {
  MSG as MSG_VISITA,
  validarDocumento,
  validarNombre,
  validarUnidad,
} from "@/lib/validaciones/visita";

// Validadores puros de portería (H08): los usan el formulario y la Server
// Action. Los mensajes coinciden con los del backend.

export const MSG = {
  nombre: MSG_VISITA.nombre,
  documento: MSG_VISITA.documento,
  unidad: "Selecciona la unidad visitada",
  motivo: "El motivo debe tener entre 5 y 100 caracteres",
  busqueda: "Escribe un código de 6 dígitos o un número de documento",
} as const;

export type CamposVisitante = {
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  unidadId: string;
  motivo: string;
};

export type ErroresVisitante = Partial<Record<keyof CamposVisitante, string>>;

export const validarMotivo = (v: string) =>
  v.trim().length >= 5 && v.trim().length <= 100 ? undefined : MSG.motivo;

export function validarVisitante(c: CamposVisitante): ErroresVisitante {
  const todos: ErroresVisitante = {
    nombre: validarNombre(c.nombre),
    numeroDocumento: validarDocumento(c.tipoDocumento, c.numeroDocumento),
    unidadId: validarUnidad(c.unidadId) && MSG.unidad,
    motivo: validarMotivo(c.motivo),
  };
  return Object.fromEntries(
    Object.entries(todos).filter(([, v]) => v),
  ) as ErroresVisitante;
}

export function aEntradaSinCodigo(c: CamposVisitante): EntradaSinCodigo {
  const tipo = c.tipoDocumento as TipoDocumento;
  const numero = c.numeroDocumento.trim();
  return {
    nombre: c.nombre.trim(),
    tipoDocumento: tipo,
    numeroDocumento: tipo === "PASAPORTE" ? numero.toUpperCase() : numero,
    unidadId: c.unidadId,
    motivo: c.motivo.trim(),
  };
}

// Ubica bajo su campo los mensajes 400 del backend; el resto va arriba.
const CAMPO_DE_MENSAJE: Record<string, keyof CamposVisitante> = {
  [MSG.nombre]: "nombre",
  [MSG.documento]: "numeroDocumento",
  [MSG.unidad]: "unidadId",
  [MSG.motivo]: "motivo",
};

export function erroresDesdeApi(messages: string[]) {
  const errores: ErroresVisitante = {};
  const resto: string[] = [];
  for (const m of messages) {
    const campo = CAMPO_DE_MENSAJE[m];
    if (campo) errores[campo] = m;
    else resto.push(m);
  }
  return { errores, resto };
}

// Búsqueda: código de 6 dígitos o documento (3 a 12, en mayúsculas).
export const normalizarBusqueda = (v: string) => v.trim().toUpperCase();
export const validarBusqueda = (v: string) => {
  const q = normalizarBusqueda(v);
  return q.length >= 3 && q.length <= 12 ? undefined : MSG.busqueda;
};

// Hora "HH:mm" (24 h) en El Salvador a partir de un ISO date-time.
export function formatHora(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-SV", {
    timeZone: "America/El_Salvador",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(d);
}

// Los avisos viajan en la URL como claves, nunca como texto libre: así la
// página solo muestra mensajes conocidos.
export const AVISOS = {
  entrada: (hora: string) => `Entrada registrada a las ${hora}`,
  salida: (hora: string) => `Salida registrada a las ${hora}`,
} as const;

export const ERRORES = {
  usado: "Código no válido: está usado",
  cancelado: "Código no válido: está cancelado",
  vencido: "Código no válido: está vencido",
  otra_fecha: "Código no válido: es para otra fecha",
  no_existe: "No existe una autorización con ese código",
  ya_salio: "Este visitante ya registró su salida",
  no_registro: "El registro de acceso no existe",
  permiso: "No tienes permiso para esta acción",
  entrada: "No pudimos registrar la entrada. Intenta de nuevo.",
  salida: "No pudimos registrar la salida. Intenta de nuevo.",
} as const;

export type ClaveError = keyof typeof ERRORES;

// Traduce el mensaje 409 del backend a su clave.
export function claveDeConflicto(message: string): ClaveError | undefined {
  return (Object.keys(ERRORES) as ClaveError[]).find(
    (k) => ERRORES[k] === message,
  );
}

export const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
