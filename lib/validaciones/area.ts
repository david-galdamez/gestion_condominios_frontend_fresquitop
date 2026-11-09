import type { DatosArea } from "@/lib/types/areas";

// Validadores puros: se usan igual en el formulario (cliente) y en la Server
// Action. Los mensajes son los mismos que devuelve el backend (H03).

export const MSG = {
  nombre: "El nombre debe tener entre 3 y 40 caracteres",
  capacidad: "La capacidad debe estar entre 1 y 200 personas",
  hora: "La hora debe ser en punto, en formato HH:00 (24 h)",
  horario: "La hora de cierre debe ser posterior a la de apertura",
  duracion: "La duración máxima debe estar entre 1 y 8 horas",
  duplicado: "Ya existe un área con ese nombre",
} as const;

export const DURACION_DEFAULT = 3;

// Opciones del selector: solo horas en punto, 00:00 a 23:00.
export const HORAS = Array.from(
  { length: 24 },
  (_, h) => `${String(h).padStart(2, "0")}:00`,
);
export const DURACIONES = Array.from({ length: 8 }, (_, i) => i + 1);

// Los valores del formulario llegan como texto.
export type CamposArea = {
  nombre: string;
  capacidad: string;
  horaApertura: string;
  horaCierre: string;
  duracionMaxHoras: string;
};

export type ErroresArea = Partial<Record<keyof CamposArea, string>>;

const HORA_EN_PUNTO = /^([01]\d|2[0-3]):00$/;
const ENTERO = /^\d+$/;

const enRango = (v: string, min: number, max: number) =>
  ENTERO.test(v.trim()) && Number(v) >= min && Number(v) <= max;

export const validarNombre = (v: string) =>
  v.trim().length >= 3 && v.trim().length <= 40 ? undefined : MSG.nombre;

export const validarCapacidad = (v: string) =>
  enRango(v, 1, 200) ? undefined : MSG.capacidad;

export const validarHora = (v: string) =>
  HORA_EN_PUNTO.test(v) ? undefined : MSG.hora;

export const validarDuracion = (v: string) =>
  enRango(v, 1, 8) ? undefined : MSG.duracion;

// El error de horario va bajo el cierre. "HH:00" compara igual como texto.
export function validarCierre(apertura: string, cierre: string) {
  const formato = validarHora(cierre);
  if (formato) return formato;
  if (validarHora(apertura)) return undefined;
  return cierre > apertura ? undefined : MSG.horario;
}

// Devuelve solo los campos con error; un objeto vacío significa válido.
export function validarArea(c: CamposArea): ErroresArea {
  const todos: ErroresArea = {
    nombre: validarNombre(c.nombre),
    capacidad: validarCapacidad(c.capacidad),
    horaApertura: validarHora(c.horaApertura),
    horaCierre: validarCierre(c.horaApertura, c.horaCierre),
    duracionMaxHoras: validarDuracion(c.duracionMaxHoras),
  };
  return Object.fromEntries(
    Object.entries(todos).filter(([, v]) => v !== undefined),
  ) as ErroresArea;
}

export function aDatosArea(c: CamposArea): DatosArea {
  return {
    nombre: c.nombre.trim(),
    capacidad: Number(c.capacidad),
    horaApertura: c.horaApertura,
    horaCierre: c.horaCierre,
    duracionMaxHoras: Number(c.duracionMaxHoras),
  };
}

// Ubica bajo su campo los mensajes 400 del backend que reconoce; el resto se
// muestra arriba del formulario.
const CAMPO_DE_MENSAJE: Record<string, keyof CamposArea> = {
  [MSG.nombre]: "nombre",
  [MSG.capacidad]: "capacidad",
  [MSG.horario]: "horaCierre",
  [MSG.duracion]: "duracionMaxHoras",
};

export function erroresDesdeApi(messages: string[]) {
  const errores: ErroresArea = {};
  const resto: string[] = [];
  for (const m of messages) {
    const campo = CAMPO_DE_MENSAJE[m];
    if (campo) errores[campo] = m;
    else resto.push(m);
  }
  return { errores, resto };
}
