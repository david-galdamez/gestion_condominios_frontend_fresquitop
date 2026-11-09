export type CategoriaReporte =
  | "FUGA"
  | "LUMINARIA"
  | "ASCENSOR"
  | "LIMPIEZA"
  | "OTRO";

export const CATEGORIAS_REPORTE: CategoriaReporte[] = [
  "FUGA",
  "LUMINARIA",
  "ASCENSOR",
  "LIMPIEZA",
  "OTRO",
];

export type EstadoReporte = "ABIERTO" | "EN_PROCESO" | "RESUELTO";

export type ReporteResumen = {
  id: string;
  numero: string; // "REP-000123"
  titulo: string;
  categoria: CategoriaReporte;
  estado: EstadoReporte;
  creadoEn: string; // ISO 8601
};

export type Reporte = ReporteResumen & {
  ubicacion: string;
  descripcion: string;
  fotos: string[]; // rutas de descarga del backend
};

export type ReportesRespuesta = {
  datos: ReporteResumen[];
  total: number;
  pagina: number;
  porPagina: number;
};

export type Ubicaciones = { torres: string[]; areasComunes: string[] };
