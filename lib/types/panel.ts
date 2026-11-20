export type PanelMora = {
  monto: number;
  unidadesMorosas: number;
  porcentajeMorosas: number;
};

export type PanelOcupacion = {
  area: string;
  porcentaje: number;
  // null: el periodo anterior valía 0 ("Sin base de comparación").
  cambio: number | null;
};

export type PanelIncidencias = {
  ALTA: number;
  MEDIA: number;
  BAJA: number;
  SIN_ASIGNAR: number;
  cambio: number | null;
};

export type PanelParticipacion = {
  asamblea: string;
  porcentaje: number;
};

export type PanelRespuesta = {
  mora: PanelMora;
  ocupacion: PanelOcupacion[];
  areaMasUsada: string | null;
  incidencias: PanelIncidencias;
  participacion: PanelParticipacion[];
  generadoEn: string;
};

export type PeriodoClave = "mes" | "3m" | "12m" | "rango";

export type PanelPeriodo = {
  periodo: PeriodoClave;
  desde: string; // "YYYY-MM-DD"
  hasta: string; // "YYYY-MM-DD"
};

export const PERIODOS: { clave: PeriodoClave; etiqueta: string }[] = [
  { clave: "mes", etiqueta: "Mes actual" },
  { clave: "3m", etiqueta: "Últimos 3 meses" },
  { clave: "12m", etiqueta: "Últimos 12 meses" },
  { clave: "rango", etiqueta: "Rango de fechas" },
];

export const MAX_DIAS_PANEL = 366;
