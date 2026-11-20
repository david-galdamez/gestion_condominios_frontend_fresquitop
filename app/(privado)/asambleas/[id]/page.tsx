import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReintentarButton } from '@/app/(privado)/estado-cuenta/reintentar-button';
import { getDetalleAsambleaResidente } from '@/lib/asambleas';
import { requireRol } from '@/lib/auth';
import type { EstadoAsamblea } from '@/lib/types/asambleas';
import { VotacionForm } from './votacion-form';

export const metadata: Metadata = { title: 'Votación de Asamblea' };

const ESTADO_LABEL: Record<EstadoAsamblea, string> = {
  BORRADOR: 'Borrador',
  PUBLICADA: 'Publicada',
  ABIERTA: 'Abierta',
  CERRADA: 'Cerrada',
};

const ESTADO_BADGE: Record<EstadoAsamblea, string> = {
  BORRADOR: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  PUBLICADA: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  ABIERTA: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  CERRADA: 'bg-zinc-500 text-white dark:bg-zinc-700 dark:text-zinc-100',
};

function formatFechaHoraSv(iso: string): string {
  return new Intl.DateTimeFormat('es-SV', {
    timeZone: 'America/El_Salvador',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export default async function DetalleAsambleaResidentePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRol('RESIDENTE');
  const { id } = await params;

  const r = await getDetalleAsambleaResidente(id);

  if (r.status === 'not_found' || r.status === 'bad_request') {
    notFound();
  }

  if (r.status === 'forbidden') {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">Votación de Asamblea</h1>
        <p role="alert" className="text-red-600 dark:text-red-400">
          No tienes permiso para esta acción
        </p>
        <Link href="/asambleas" className="text-sm underline">
          Volver a asambleas
        </Link>
      </div>
    );
  }

  if (r.status !== 'ok') {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Votación de Asamblea</h1>
        <p role="alert" className="text-red-600 dark:text-red-400">
          No pudimos cargar la asamblea. Intenta de nuevo.
        </p>
        <ReintentarButton />
      </div>
    );
  }

  const asamblea = r.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/asambleas"
          className="self-start text-sm text-zinc-600 hover:text-foreground dark:text-zinc-400"
        >
          ← Volver a asambleas
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">
            Votación de Asamblea — {asamblea.titulo}
          </h1>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_BADGE[asamblea.estado]}`}
          >
            {ESTADO_LABEL[asamblea.estado]}
          </span>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Estado: <strong>{ESTADO_LABEL[asamblea.estado]}</strong> · Apertura:{' '}
          <span className="tabular-nums">{formatFechaHoraSv(asamblea.fechaApertura)}</span> ·
          Cierre: <span className="tabular-nums">{formatFechaHoraSv(asamblea.fechaCierre)}</span>.
          El voto de tu unidad es secreto e irreversible.
        </p>

        {asamblea.descripcion && (
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{asamblea.descripcion}</p>
        )}
      </div>

      <VotacionForm asamblea={asamblea} />
    </div>
  );
}