import 'server-only';
import { apiFetch } from '@/lib/api';
import type {
  Asamblea,
  ComprobanteVerificacion,
  DetalleAsambleaResidente,
  EmitirVotosRespuesta,
  EmitirVotosSolicitud,
  NuevaAsamblea,
  ResultadoAsamblea,
} from '@/lib/types/asambleas';

export type AsambleasResultado<T> =
  | { status: 'ok'; data: T }
  | { status: 'bad_request'; messages: string[] }
  | { status: 'conflict'; message?: string }
  | { status: 'forbidden' }
  | { status: 'not_found' }
  | { status: 'error' };

async function llamar<T>(
  path: string,
  init: RequestInit | undefined,
  extraer: (body: unknown) => T | null,
): Promise<AsambleasResultado<T>> {
  let res: Response;
  try {
    res = await apiFetch(path, init);
  } catch (e) {
    if (e instanceof Error && !('digest' in e)) return { status: 'error' };
    throw e;
  }
  if (res.status === 403) return { status: 'forbidden' };
  if (res.status === 404) return { status: 'not_found' };
  if (res.status === 409) {
    const body = await res.json().catch(() => null);
    const m = (body as { message?: unknown } | null)?.message;
    const message = Array.isArray(m) ? String(m[0]) : typeof m === 'string' ? m : undefined;
    return { status: 'conflict', message };
  }
  if (res.status === 400) {
    const body = await res.json().catch(() => null);
    const m = (body as { message?: unknown } | null)?.message;
    const messages = Array.isArray(m)
      ? m.map(String)
      : typeof m === 'string'
        ? [m]
        : ['Los datos no son válidos'];
    return { status: 'bad_request', messages };
  }
  if (!res.ok) return { status: 'error' };
  const body = await res.json().catch(() => null);
  const data = extraer(body);
  return data === null ? { status: 'error' } : { status: 'ok', data };
}

const esAsamblea = (x: unknown): x is Asamblea =>
  !!x && typeof (x as Asamblea).id === 'string';

const esDetalleResidente = (x: unknown): x is DetalleAsambleaResidente =>
  !!x &&
  typeof (x as DetalleAsambleaResidente).id === 'string' &&
  Array.isArray((x as DetalleAsambleaResidente).temas);

const esRespuestaVotos = (x: unknown): x is EmitirVotosRespuesta =>
  !!x && Array.isArray((x as EmitirVotosRespuesta).comprobantes);

export const crearAsamblea = (datos: NuevaAsamblea) =>
  llamar<Asamblea>(
    'asambleas',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    },
    (b) => (esAsamblea(b) ? b : null),
  );

export const publicarAsamblea = (id: string) =>
  llamar<{ id: string; estado: string; publicadaEn: string; unidadesConvocadas: number }>(
    `asambleas/${id}/publicar`,
    { method: 'POST' },
    (b) =>
      b && typeof (b as { id?: unknown }).id === 'string'
        ? (b as { id: string; estado: string; publicadaEn: string; unidadesConvocadas: number })
        : null,
  );

export const obtenerResultados = (id: string) =>
  llamar<ResultadoAsamblea>(`asambleas/${id}/resultados`, undefined, (b) =>
    b && typeof (b as { asambleaId?: unknown }).asambleaId === 'string'
      ? (b as ResultadoAsamblea)
      : null,
  );

export const verificarComprobante = (codigo: string) =>
  llamar<ComprobanteVerificacion>(
    `asambleas/comprobantes/verificar?codigo=${encodeURIComponent(codigo)}`,
    undefined,
    (b) =>
      b && typeof (b as { valido?: unknown }).valido === 'boolean'
        ? (b as ComprobanteVerificacion)
        : null,
  );

export const getAsambleas = () =>
  llamar<Asamblea[]>('asambleas', undefined, (b: unknown) =>
    Array.isArray(b) ? (b as Asamblea[]) : null,
  );

export const getAsambleasResidente = () =>
  llamar<DetalleAsambleaResidente[]>('asambleas', undefined, (b: unknown) =>
    Array.isArray(b) ? (b as DetalleAsambleaResidente[]) : null,
  );

export const getDetalleAsambleaResidente = (id: string) =>
  llamar<DetalleAsambleaResidente>(
    `asambleas/${encodeURIComponent(id)}`,
    undefined,
    (b) => (esDetalleResidente(b) ? b : null),
  );

export const emitirVotos = (asambleaId: string, datos: EmitirVotosSolicitud) =>
  llamar<EmitirVotosRespuesta>(
    `asambleas/${encodeURIComponent(asambleaId)}/votos`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    },
    (b) => (esRespuestaVotos(b) ? b : null),
  );
