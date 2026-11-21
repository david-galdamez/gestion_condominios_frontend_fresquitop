export type Notificacion = {
  id: string;
  titulo: string;
  mensaje: string;
  moduloOrigen: string;
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