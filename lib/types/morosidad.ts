export const POR_PAGINA_MOROSIDAD = 20;

export type TorreOpcion = {
  id: string;
  nombre: string;
};

export const TORRES_DEFAULT: TorreOpcion[] = [
  { id: "Torre A", nombre: "Torre A" },
  { id: "Torre B", nombre: "Torre B" },
  { id: "Torre C", nombre: "Torre C" },
];

export type UnidadMorosa = {
  unidad: string;
  cuotasVencidas: number;
  montoAdeudado: number;
  vencidaMasAntigua: string; // "YYYY-MM-DD"
};

export type MorosidadRespuesta = {
  totalMora: number;
  unidadesMorosas: number;
  datos: UnidadMorosa[];
  total: number;
  pagina: number;
};

export type MorosidadFiltros = {
  torreId?: string;
  pagina?: number;
};