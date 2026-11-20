'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { crearAsamblea, publicarAsamblea } from '@/lib/asambleas';
import { aIsoSv, validarAsamblea, MSG, type ErroresAsamblea } from '@/lib/validaciones/asamblea';

export type GuardarAsambleaState = { status: 'idle' | 'error'; errores?: ErroresAsamblea; mensajes?: string[]; };
const RUTA_LISTA = '/admin/asambleas';

export async function guardarAsamblea(_prev: GuardarAsambleaState, formData: FormData): Promise<GuardarAsambleaState> {
  const datosRaw = String(formData.get('datos') ?? '{}');
  let parsed: any;
  try { parsed = JSON.parse(datosRaw); } catch { parsed = {}; }

  const campos = { titulo: String(parsed.titulo ?? '').trim(), descripcion: String(parsed.descripcion ?? '').trim(), fechaApertura: String(parsed.fechaApertura ?? ''), fechaCierre: String(parsed.fechaCierre ?? '') };
  const temas = Array.isArray(parsed.temas) ? parsed.temas : [];

  const errores = validarAsamblea(campos, temas);
  if (Object.keys(errores).length > 0) return { status: 'error', errores };

  const r = await crearAsamblea({ 
    titulo: campos.titulo, 
    descripcion: campos.descripcion, 
    fechaApertura: aIsoSv(campos.fechaApertura), 
    fechaCierre: aIsoSv(campos.fechaCierre), 
    temas: temas.map((t: any) => ({ 
      titulo: String(t.titulo).trim(), 
      opciones: t.opciones.map((o: any) => ({ texto: String(o.texto).trim() })) 
    })) 
  });

  switch (r.status) {
    case 'ok': revalidatePath(RUTA_LISTA); redirect(`${RUTA_LISTA}?ok=creada`);
    case 'bad_request': return { status: 'error', mensajes: r.messages };
    case 'forbidden': return { status: 'error', mensajes: ['No tienes permiso para esta accion'] };
    default: return { status: 'error', mensajes: ['No pudimos guardar la asamblea. Intenta de nuevo.'] };
  }
}

export type PublicarAsambleaState = { ok: true; unidadesConvocadas: number } | { ok: false; error: string };
export async function accionPublicarAsamblea(id: string): Promise<PublicarAsambleaState> {
  const r = await publicarAsamblea(id);
  switch (r.status) {
    case 'ok': revalidatePath(RUTA_LISTA); return { ok: true, unidadesConvocadas: r.data.unidadesConvocadas };
    case 'bad_request': return { ok: false, error: r.messages[0] ?? MSG.publicar };
    case 'not_found': return { ok: false, error: 'La asamblea no existe' };
    case 'forbidden': return { ok: false, error: 'No tienes permiso para esta accion' };
    default: return { ok: false, error: 'No pudimos publicar la asamblea. Intenta de nuevo.' };
  }
}