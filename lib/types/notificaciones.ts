export const MODULOS_ORIGEN = [
  "PAGOS",
  "RESERVAS",
  "INCIDENCIAS",
  "VISITAS",
  "PAQUETERIA",
  "VOTACIONES",
  "COMUNICADOS",
] as const;

export type ModuloOrigen = (typeof MODULOS_ORIGEN)[number];

export type Notificacion = {
  id: string;
  titulo: string;
  mensaje: string;
  moduloOrigen: ModuloOrigen | (string & {});
  referencia: string | null;
  leida: boolean;
  leidaEn: string | null;
  createdAt: string;
};

export type NotificacionesResponse = {
  datos: Notificacion[];
  total: number;
  pagina: number;
  totalPaginas: number;
};

export type ConteoNoLeidas = {
  noLeidas: number;
};