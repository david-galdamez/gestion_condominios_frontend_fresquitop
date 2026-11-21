import 'server-only';
import { apiFetch } from '@/lib/api';
import type { NotificacionesResponse, ConteoNoLeidas } from '@/lib/types/notificaciones';

export const getNotificaciones = async (pagina: number = 1): Promise<NotificacionesResponse> => {
  const res = await apiFetch(`notificaciones?pagina=${pagina}`);
  if (!res.ok) throw new Error('Error al cargar notificaciones');
  return res.json();
};

export const getConteoNoLeidas = async (): Promise<ConteoNoLeidas> => {
  const res = await apiFetch('notificaciones/no-leidas/conteo');
  if (!res.ok) return { noLeidas: 0 };
  return res.json();
};

export const marcarComoLeida = async (id: string) => {
  const res = await apiFetch(`notificaciones/${id}/leer`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Error al marcar como leída');
  return res.json();
};

export const marcarTodasComoLeidas = async () => {
  const res = await apiFetch('notificaciones/marcar-todas', { method: 'PATCH' });
  if (!res.ok) throw new Error('Error al marcar todas como leídas');
  return res.json();
};