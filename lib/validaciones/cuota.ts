import { formatPeriodo, hoyEnElSalvador } from "@/lib/format";
import type {
  DatosConfiguracion,
  ResultadoGeneracion,
} from "@/lib/types/cuotas";

// Validadores puros: se usan igual en el formulario (cliente) y en la Server
// Action. Los mensajes son los mismos que devuelve el backend (H02).

export const MSG = {
  monto: "El monto mensual debe estar entre $1.00 y $9,999.99",
  dia: "El día de vencimiento debe estar entre 1 y 28",
  periodo: "El periodo debe tener el formato AAAA-MM",
  periodoFuturo: "Solo puedes generar hasta el mes siguiente al actual",
  sinConfiguracion: "No existe configuración de cuota",
} as const;

export type CamposConfiguracion = { montoMensual: string; diaVencimiento: string };
export type ErroresConfiguracion = Partial<
  Record<keyof CamposConfiguracion, string>
>;

const MONTO = /^\d{1,4}(\.\d{1,2})?$/;
const ENTERO = /^\d+$/;
const PERIODO = /^\d{4}-(0[1-9]|1[0-2])$/;

export const validarMonto = (v: string) => {
  const t = v.trim();
  return MONTO.test(t) && Number(t) >= 1 && Number(t) <= 9999.99
    ? undefined
    : MSG.monto;
};

export const validarDia = (v: string) => {
  const t = v.trim();
  return ENTERO.test(t) && Number(t) >= 1 && Number(t) <= 28
    ? undefined
    : MSG.dia;
};

// Devuelve solo los campos con error; un objeto vacío significa válido.
export function validarConfiguracion(
  c: CamposConfiguracion,
): ErroresConfiguracion {
  const todos: ErroresConfiguracion = {
    montoMensual: validarMonto(c.montoMensual),
    diaVencimiento: validarDia(c.diaVencimiento),
  };
  return Object.fromEntries(
    Object.entries(todos).filter(([, v]) => v !== undefined),
  ) as ErroresConfiguracion;
}

export const aDatosConfiguracion = (
  c: CamposConfiguracion,
): DatosConfiguracion => ({
  montoMensual: Number(c.montoMensual.trim()),
  diaVencimiento: Number(c.diaVencimiento.trim()),
});

// Ubica bajo su campo los mensajes 400 del backend; el resto va arriba.
const CAMPO_DE_MENSAJE: Record<string, keyof CamposConfiguracion> = {
  [MSG.monto]: "montoMensual",
  [MSG.dia]: "diaVencimiento",
};

export function erroresDesdeApi(messages: string[]) {
  const errores: ErroresConfiguracion = {};
  const resto: string[] = [];
  for (const m of messages) {
    const campo = CAMPO_DE_MENSAJE[m];
    if (campo) errores[campo] = m;
    else resto.push(m);
  }
  return { errores, resto };
}

// --- Periodos ("YYYY-MM") en la zona del negocio ---------------------------

export const periodoActual = (ahora: Date = new Date()) =>
  hoyEnElSalvador(ahora).slice(0, 7);

export function sumarMeses(periodo: string, n: number) {
  const [a, m] = periodo.split("-").map(Number);
  const total = a * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

// Mes actual y siguiente: los que se ofrecen para la generación manual.
export const periodosGenerables = (ahora: Date = new Date()) => {
  const actual = periodoActual(ahora);
  return [actual, sumarMeses(actual, 1)];
};

export function validarPeriodo(v: string, ahora: Date = new Date()) {
  if (!PERIODO.test(v)) return MSG.periodo;
  return v <= sumarMeses(periodoActual(ahora), 1) ? undefined : MSG.periodoFuturo;
}

// Texto del resultado de una generación (criterio de H02 para las omitidas).
export function mensajesResultado(r: ResultadoGeneracion): string[] {
  const mes = formatPeriodo(r.periodo);
  const mensajes = [
    r.creadas === 0
      ? `No se crearon cuotas nuevas para ${mes}.`
      : `Se ${r.creadas === 1 ? "creó 1 cuota" : `crearon ${r.creadas} cuotas`} para ${mes}.`,
  ];
  if (r.omitidas > 0) {
    mensajes.push(`Se omitieron ${r.omitidas} unidades que ya tenían cuota`);
  }
  return mensajes;
}
