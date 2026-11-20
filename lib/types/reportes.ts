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

export const ESTADOS_REPORTE: EstadoReporte[] = [
  "ABIERTO",
  "EN_PROCESO",
  "RESUELTO",
];

export type PrioridadReporte = "ALTA" | "MEDIA" | "BAJA";

export const PRIORIDADES_REPORTE: PrioridadReporte[] = [
  "ALTA",
  "MEDIA",
  "BAJA",
];

export const POR_PAGINA_REPORTES = 20;

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

// H06 — Tipos para administración de reportes
export type ResidenteReporte = {
  id: string;
  nombre: string;
  email: string;
};

export type AdminReporteItem = {
  id: string;
  numero: string;
  titulo: string;
  categoria: CategoriaReporte;
  ubicacion: string;
  estado: EstadoReporte;
  prioridad: PrioridadReporte | null;
  responsable: string | null;
  creadoEn: string;
  residente: ResidenteReporte;
  unidades: string[];
};

export type AdminReportesRespuesta = {
  datos: AdminReporteItem[];
  total: number;
  pagina: number;
  porPagina: number;
};

export type EvidenciaDetalle = {
  id: string;
  mimeType: string;
  tamanoBytes: number;
  orden: number;
  url: string;
};

export type HistorialReporteItem = {
  id: string;
  estado: EstadoReporte;
  comentario: string | null;
  fecha: string;
  autor: {
    id: string;
    nombre: string;
    rol: "RESIDENTE" | "ADMINISTRADOR" | "SEGURIDAD";
  };
};

export type AdminReporteDetalle = AdminReporteItem & {
  descripcion: string;
  evidencias: EvidenciaDetalle[];
  historial: HistorialReporteItem[];
};

export type AdminReportesFiltros = {
  estado?: EstadoReporte;
  categoria?: CategoriaReporte;
  pagina?: number;
};

export type AsignarReportePayload = {
  prioridad: PrioridadReporte;
  responsable: string;
};

export type AsignacionReporteRespuesta = {
  id: string;
  numero: string;
  estado: EstadoReporte;
  prioridad: PrioridadReporte;
  responsable: string;
};