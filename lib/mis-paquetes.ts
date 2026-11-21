import 'server-only';
import { apiFetch } from '@/lib/api';
import type { MiPaquete, DetallePaquete } from '@/lib/types/mis-paquetes';

export const getMisPaquetes = async (filtro: string = 'TODOS', pagina: number = 1) => {
  const res = await apiFetch(`paquetes/mios?filtro=${filtro}&pagina=${pagina}`);
  
  if (!res.ok) {
    // Intentar leer el mensaje de error del backend
    const body = await res.json().catch(() => null);
    const msg = body?.message || `Error ${res.status}: ${res.statusText}`;
    throw new Error(msg);
  }
  
  return res.json();
};

export const getDetallePaquete = async (id: string): Promise<DetallePaquete> => {
  const res = await apiFetch(`paquetes/mios/${id}`);
  
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg = body?.message || `Error ${res.status}: ${res.statusText}`;
    throw new Error(msg);
  }
  
  return res.json();
};