'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { crearAsamblea, emitirVotos, publicarAsamblea } from '@/lib/asambleas';
import type { ComprobanteVoto, VotoItemSolicitud } from '@/lib/types/asambleas';
import { aIsoSv, validarAsamblea, MSG, type ErroresAsamblea } from '@/lib/validaciones/asamblea';

export type GuardarAsambleaState = {
  status: 'idle' | 'error';
  errores?: ErroresAsamblea;
  mensajes?: string[];
};

const RUTA_LISTA = '/admin/asambleas';
const RUTA_RESIDENTE = '/asambleas';

export async function guardarAsamblea(
  _prev: GuardarAsambleaState,
  formData: FormData,
): Promise<GuardarAsambleaState> {
  const datosRaw = String(formData.get('datos') ?? '{}');
  let parsed: {
    titulo?: unknown;
    descripcion?: unknown;
    fechaApertura?: unknown;
    fechaCierre?: unknown;
    temas?: Array<{ titulo?: unknown; opciones?: Array<{ texto?: unknown }> }>;
  };
  try {
    parsed = JSON.parse(datosRaw);
  } catch {
    parsed = {};
  }

  const campos = {
    titulo: String(parsed.titulo ?? '').trim(),
    descripcion: String(parsed.descripcion ?? '').trim(),
    fechaApertura: String(parsed.fechaApertura ?? ''),
    fechaCierre: String(parsed.fechaCierre ?? ''),
  };
  const temas = Array.isArray(parsed.temas)
    ? parsed.temas.map((t) => ({
        titulo: String(t.titulo ?? '').trim(),
        opciones: Array.isArray(t.opciones)
          ? t.opciones.map((o) => ({ texto: String(o.texto ?? '').trim() }))
          : [],
      }))
    : [];

  const errores = validarAsamblea(campos, temas);
  if (Object.keys(errores).length > 0) return { status: 'error', errores };

  const r = await crearAsamblea({
    titulo: campos.titulo,
    descripcion: campos.descripcion,
    fechaApertura: aIsoSv(campos.fechaApertura),
    fechaCierre: aIsoSv(campos.fechaCierre),
    temas,
  });

  switch (r.status) {
    case 'ok':
      revalidatePath(RUTA_LISTA);
      redirect(`${RUTA_LISTA}?ok=creada`);
    case 'bad_request':
      return { status: 'error', mensajes: r.messages };
    case 'forbidden':
      return { status: 'error', mensajes: ['No tienes permiso para esta acción'] };
    default:
      return { status: 'error', mensajes: ['No pudimos guardar la asamblea. Intenta de nuevo.'] };
  }
}

export type PublicarAsambleaState =
  | { ok: true; unidadesConvocadas: number }
  | { ok: false; error: string };

export async function accionPublicarAsamblea(id: string): Promise<PublicarAsambleaState> {
  const r = await publicarAsamblea(id);
  switch (r.status) {
    case 'ok':
      revalidatePath(RUTA_LISTA);
      revalidatePath(RUTA_RESIDENTE);
      return { ok: true, unidadesConvocadas: r.data.unidadesConvocadas };
    case 'bad_request':
      return { ok: false, error: r.messages[0] ?? MSG.publicar };
    case 'not_found':
      return { ok: false, error: 'La asamblea no existe' };
    case 'forbidden':
      return { ok: false, error: 'No tienes permiso para esta acción' };
    default:
      return { ok: false, error: 'No pudimos publicar la asamblea. Intenta de nuevo.' };
  }
}

export type EmitirVotosErrorCodigo =
  | 'ya_voto'
  | 'no_abierta'
  | 'bad_request'
  | 'forbidden'
  | 'not_found'
  | 'error';

export type EmitirVotosActionResult =
  | { ok: true; comprobantes: ComprobanteVoto[] }
  | { ok: false; codigo: EmitirVotosErrorCodigo; error: string };

export async function accionEmitirVotos(
  asambleaId: string,
  votos: VotoItemSolicitud[],
): Promise<EmitirVotosActionResult> {
  if (!Array.isArray(votos) || votos.length === 0) {
    return { ok: false, codigo: 'bad_request', error: 'Selecciona al menos un tema para votar' };
  }
  if (votos.length > 10) {
    return { ok: false, codigo: 'bad_request', error: 'Máximo 10 votos por petición' };
  }

  const temasUnicos = new Set(votos.map((v) => v.temaId));
  if (temasUnicos.size !== votos.length) {
    return {
      ok: false,
      codigo: 'bad_request',
      error: 'No se pueden enviar temas repetidos en la misma petición',
    };
  }

  const r = await emitirVotos(asambleaId, { votos });

  switch (r.status) {
    case 'ok':
      revalidatePath(RUTA_RESIDENTE);
      revalidatePath(`${RUTA_RESIDENTE}/${asambleaId}`);
      return { ok: true, comprobantes: r.data.comprobantes };
    case 'conflict': {
      revalidatePath(RUTA_RESIDENTE);
      revalidatePath(`${RUTA_RESIDENTE}/${asambleaId}`);
      const msg = r.message ?? 'La votación no está abierta';
      const esYaVoto = /ya vot[oó]/i.test(msg);
      return {
        ok: false,
        codigo: esYaVoto ? 'ya_voto' : 'no_abierta',
        error: esYaVoto ? 'Tu unidad ya votó este tema' : 'La votación no está abierta',
      };
    }
    case 'bad_request':
      return {
        ok: false,
        codigo: 'bad_request',
        error: r.messages[0] ?? 'Los datos del voto no son válidos',
      };
    case 'forbidden':
      return {
        ok: false,
        codigo: 'forbidden',
        error: 'No tienes permiso para esta acción',
      };
    case 'not_found':
      return {
        ok: false,
        codigo: 'not_found',
        error: 'La asamblea no existe',
      };
    default:
      return {
        ok: false,
        codigo: 'error',
        error: 'No pudimos guardar tus votos. Intenta de nuevo.',
      };
  }
}