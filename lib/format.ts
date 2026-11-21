const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
  "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const usd = new Intl.NumberFormat("es-SV", {
  style: "currency",
  currency: "USD",
});

export const formatUsd = (n: number) => usd.format(n);

// "2026-10" -> "Octubre 2026". Se parsea la cadena, sin usar Date.
export function formatPeriodo(periodo: string) {
  const [anio, mes] = periodo.split("-");
  const nombre = MESES[Number(mes) - 1];
  return nombre ? `${nombre} ${anio}` : periodo;
}

// "2026-10-10" -> "10/10/2026". Sin Date para evitar corrimiento de zona horaria.
export function formatFecha(iso: string) {
  const [anio, mes, dia] = iso.slice(0, 10).split("-");
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : iso;
}

// Valida "YYYY-MM-DD" y que el día exista en el calendario (incluye bisiestos).
// Aritmética pura, sin Date: independiente de la zona horaria.
export function esFechaValida(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const anio = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  if (mes < 1 || mes > 12 || dia < 1) return false;
  const bisiesto = (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0;
  const diasMes = [31, bisiesto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return dia <= diasMes[mes - 1];
}

const ZONA_NEGOCIO = "America/El_Salvador";

// Fecha de hoy ("YYYY-MM-DD") en la zona del negocio, sin importar la zona del
// servidor o del navegador. "en-CA" produce directamente el formato ISO.
export function hoyEnElSalvador(ahora: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_NEGOCIO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
}

// Suma (o resta) días a una fecha ISO. Se usa UTC para que ningún corrimiento
// de zona u horario de verano altere el resultado.
export function sumarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

// true si `iso` es una fecha real entre `hoy` y `hoy + maxDias` (inclusive).
// Las fechas ISO se comparan como texto: el orden lexicográfico es el cronológico.
export function fechaEnRango(iso: string, hoy: string, maxDias: number) {
  return esFechaValida(iso) && iso >= hoy && iso <= sumarDias(hoy, maxDias);
}

// Hora actual (0 a 23) en la zona del negocio. Sirve para rechazar reservas
// de una hora que ya pasó el mismo día.
export function horaActualEnElSalvador(ahora: Date = new Date()) {
  const h = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA_NEGOCIO,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(ahora);
  return Number(h);
}
