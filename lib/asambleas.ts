import 'server-only';
import { apiFetch } from '@/lib/api';
import type { Asamblea, NuevaAsamblea } from '@/lib/types/asambleas';

export type AsambleasResultado<T> = { status: 'ok'; data: T } | { status: 'bad_request'; messages: string[] } | { status: 'forbidden' } | { status: 'not_found' } | { status: 'error' };

async function llamar<T>(path: string, init: RequestInit | undefined, extraer: (body: unknown) => T | null): Promise<AsambleasResultado<T>> {
  let res: Response;
  try { res = await apiFetch(path, init); } catch (e) {
    if (e instanceof Error && !('digest' in e)) return { status: 'error' };
    throw e;
  }
  if (res.status === 403) return { status: 'forbidden' };
  if (res.status === 404) return { status: 'not_found' };
  if (res.status === 400) {
    const body = await res.json().catch(() => null);
    const m = body?.message;
    const messages = Array.isArray(m) ? m.map(String) : typeof m === 'string' ? [m] : ['Los datos no son validos'];
    return { status: 'bad_request', messages };
  }
  if (!res.ok) return { status: 'error' };
  const body = await res.json().catch(() => null);
  const data = extraer(body);
  return data === null ? { status: 'error' } : { status: 'ok', data };
}

const esAsamblea = (x: unknown): x is Asamblea => !!x && typeof (x as Asamblea).id === 'string';

export const crearAsamblea = (datos: NuevaAsamblea) => llamar<Asamblea>('asambleas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) }, (b) => (esAsamblea(b) ? b : null));

export const publicarAsamblea = (id: string) => llamar<{ id: string; estado: string; publicadaEn: string; unidadesConvocadas: number }>(`asambleas/${id}/publicar`, { method: 'POST' }, (b) => (b && typeof (b as any).id === 'string' ? (b as any) : null));