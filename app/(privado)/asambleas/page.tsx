import type { Metadata } from 'next';
import Link from 'next/link';
import { ReintentarButton } from '@/app/(privado)/estado-cuenta/reintentar-button';
import { getAsambleasResidente } from '@/lib/asambleas';
import { requireRol } from '@/lib/auth';
import type { EstadoAsamblea } from '@/lib/types/asambleas';

export const metadata: Metadata = { title: 'Asambleas y votaciones' };

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

export default async function AsambleasResidentePage() {
  await requireRol('RESIDENTE');
  const r = await getAsambleasResidente();

  if (r.status === 'forbidden') {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Asambleas y votaciones</h1>
        <p role="alert" className="text-red-600 dark:text-red-400">
          No tienes permiso para esta acción
        </p>
      </div>
    );
  }

  if (r.status !== 'ok') {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Asambleas y votaciones</h1>
        <p role="alert" className="text-red-600 dark:text-red-400">
          No pudimos cargar las asambleas. Intenta de nuevo.
        </p>
        <ReintentarButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Asambleas y votaciones</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Consulta las asambleas del condominio y emite el voto único y secreto de tu unidad.
        </p>
      </div>

      {r.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-zinc-300 px-6 py-12 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          <p className="font-medium text-foreground">No hay asambleas disponibles</p>
          <p className="text-sm">
            Cuando la administración publique una asamblea aparecerá aquí para que puedas revisarla y votar.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {r.data.map((asamblea) => {
            const totalTemas = asamblea.temas.length;
            const votados = asamblea.temasVotados.length;
            const todosVotados = totalTemas > 0 && votados >= totalTemas;
            const textoAccion =
              asamblea.estado === 'ABIERTA'
                ? todosVotados
                  ? 'Ver comprobantes'
                  : 'Ir a votar'
                : 'Ver detalle';

            return (
              <li
                key={asamblea.id}
                className="flex flex-col justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold leading-snug">{asamblea.titulo}</h2>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_BADGE[asamblea.estado]}`}
                    >
                      {ESTADO_LABEL[asamblea.estado]}
                    </span>
                  </div>

                  <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {asamblea.descripcion}
                  </p>

                  <dl className="grid grid-cols-1 gap-2 rounded-md bg-zinc-50 p-3 text-xs dark:bg-zinc-900 sm:grid-cols-2">
                    <div>
                      <dt className="text-zinc-500 dark:text-zinc-400">Apertura</dt>
                      <dd className="font-medium tabular-nums">
                        {formatFechaHoraSv(asamblea.fechaApertura)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500 dark:text-zinc-400">Cierre</dt>
                      <dd className="font-medium tabular-nums">
                        {formatFechaHoraSv(asamblea.fechaCierre)}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">
                    {totalTemas === 0
                      ? 'Sin temas registrados'
                      : `${votados} de ${totalTemas} temas votados por tu unidad`}
                  </span>

                  <Link
                    href={`/asambleas/${asamblea.id}`}
                    className={
                      asamblea.estado === 'ABIERTA' && !todosVotados
                        ? 'rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90'
                        : 'rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800'
                    }
                  >
                    {textoAccion}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}