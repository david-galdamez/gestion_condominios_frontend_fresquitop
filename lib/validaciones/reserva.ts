import { esFechaValida } from "@/lib/format";
import type { Area } from "@/lib/types/areas";

// Validadores puros: se usan igual en el formulario (cliente) y en la Server
// Action, así ambos lados coinciden en reglas y mensajes (H04).

export const MSG = {
  area: "Selecciona un área",
  fecha: "Elige una fecha",
  fechaPasada: "No puedes reservar en una fecha pasada",
  horaInicio: "Elige la hora de inicio",
  horaFin: "Elige la hora de fin",
  finAntesDeInicio: "La hora de fin debe ser posterior a la de inicio",
  fueraHorario: "Fuera del horario del área",
  asistentes: "Indica cuántas personas asistirán (1 o más)",
  ocupado: "Ese horario ya está reservado",
  cancelarTarde: "Ya no puedes cancelar esta reserva",
} as const;

export const msgDuracion = (n: number) =>
  `Supera la duración máxima de ${n} ${n === 1 ? "hora" : "horas"}`;

export const msgCapacidad = (n: number) =>
  `Supera la capacidad de ${n} ${n === 1 ? "persona" : "personas"}`;

// Los valores del formulario llegan como texto.
export type CamposReserva = {
  areaId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  asistentes: string;
};

export type ErroresReserva = Partial<Record<keyof CamposReserva, string>>;

// "Ahora" en la zona del negocio. Lo calcula el servidor y lo recibe el
// formulario, para no depender de la zona horaria del navegador.
export type Ahora = { hoy: string; hora: number };

const HORA_EN_PUNTO = /^([01]\d|2[0-3]):00$/;
const ENTERO = /^\d+$/;

// "09:00" -> 9
export const horaANumero = (h: string) => Number(h.slice(0, 2));
const aTexto = (n: number) => `${String(n).padStart(2, "0")}:00`;

// Horas que se pueden elegir dentro del horario del área.
// Inicio: de la apertura a una hora antes del cierre. Fin: de una hora
// después de la apertura al cierre.
export function horasDelArea(area: Pick<Area, "horaApertura" | "horaCierre">) {
  const ap = horaANumero(area.horaApertura);
  const ci = horaANumero(area.horaCierre);
  const rango = (desde: number, hasta: number) =>
    Array.from({ length: Math.max(0, hasta - desde + 1) }, (_, i) =>
      aTexto(desde + i),
    );
  return { inicios: rango(ap, ci - 1), fines: rango(ap + 1, ci) };
}

// Devuelve solo los campos con error; un objeto vacío significa válido.
// Sin `area` (caso de la Server Action) se omiten las reglas que dependen de
// ella (horario, duración y capacidad): esas las valida el backend.
export function validarReserva(
  c: CamposReserva,
  area: Area | undefined,
  ahora: Ahora,
): ErroresReserva {
  const e: ErroresReserva = {};

  if (!c.areaId) e.areaId = MSG.area;

  if (!esFechaValida(c.fecha)) e.fecha = MSG.fecha;
  else if (c.fecha < ahora.hoy) e.fecha = MSG.fechaPasada;

  const inicioOk = HORA_EN_PUNTO.test(c.horaInicio);
  const finOk = HORA_EN_PUNTO.test(c.horaFin);
  if (!inicioOk) e.horaInicio = MSG.horaInicio;
  if (!finOk) e.horaFin = MSG.horaFin;

  if (inicioOk && finOk) {
    const ini = horaANumero(c.horaInicio);
    const fin = horaANumero(c.horaFin);
    if (fin <= ini) {
      e.horaFin = MSG.finAntesDeInicio;
    } else {
      if (!e.fecha && c.fecha === ahora.hoy && ini <= ahora.hora) {
        e.horaInicio = MSG.fechaPasada;
      }
      if (area) {
        if (ini < horaANumero(area.horaApertura) || fin > horaANumero(area.horaCierre)) {
          e.horaInicio ??= MSG.fueraHorario;
        } else if (fin - ini > area.duracionMaxHoras) {
          e.horaFin = msgDuracion(area.duracionMaxHoras);
        }
      }
    }
  }

  const n = Number(c.asistentes);
  if (!ENTERO.test(c.asistentes.trim()) || n < 1) e.asistentes = MSG.asistentes;
  else if (area && n > area.capacidad) e.asistentes = msgCapacidad(area.capacidad);

  return e;
}

// Ubica bajo su campo los mensajes 400 del backend que reconoce; el resto se
// muestra arriba del formulario.
export function erroresDesdeApi(messages: string[]) {
  const errores: ErroresReserva = {};
  const resto: string[] = [];
  for (const m of messages) {
    if (m === MSG.fechaPasada) errores.fecha = m;
    else if (m === MSG.fueraHorario) errores.horaInicio = m;
    else if (m.startsWith("Supera la duración máxima")) errores.horaFin = m;
    else if (m.startsWith("Supera la capacidad")) errores.asistentes = m;
    else resto.push(m);
  }
  return { errores, resto };
}
