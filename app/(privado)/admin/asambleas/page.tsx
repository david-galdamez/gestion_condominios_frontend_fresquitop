import type { Metadata } from 'next';
import Link from 'next/link';
import { requireRol } from '@/lib/auth';
import { getAsambleas } from '@/lib/asambleas';
import { PublicarButton } from './publicar-button';

export const metadata: Metadata = { title: 'Asambleas' };

const ESTADO_BADGE: Record<string, string> = {
  BORRADOR: 'bg-zinc-200 text-zinc-700',
  PUBLICADA: 'bg-blue-100 text-blue-800',
  ABIERTA: 'bg-green-100 text-green-800',
  CERRADA: 'bg-zinc-500 text-white',
};

export default async function AsambleasPage() {
  await requireRol('ADMINISTRADOR');
  const r = await getAsambleas();

  if (r.status === 'forbidden') {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Asambleas</h1>
        <p role="alert" className="text-red-600">No tienes permiso para esta accion</p>
      </div>
    );
  }

  if (r.status !== 'ok') {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Asambleas</h1>
        <p role="alert" className="text-red-600">No pudimos cargar las asambleas. Intenta de nuevo.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Asambleas</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/asambleas/verificar"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
          >
            Verificar comprobante
          </Link>
          <Link
            href="/admin/asambleas/nuevo"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Nueva asamblea
          </Link>
        </div>
      </div>

      {r.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-zinc-600 dark:text-zinc-400">
          <p>Aun no hay asambleas registradas</p>
          <Link href="/admin/asambleas/nuevo" className="underline">
            Crea la primera asamblea
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-2 pr-4 font-medium">Titulo</th>
                <th className="py-2 pr-4 font-medium">Apertura</th>
                <th className="py-2 pr-4 font-medium">Cierre</th>
                <th className="py-2 pr-4 font-medium">Estado</th>
                <th className="py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {r.data.map((a) => (
                <tr key={a.id} className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="py-2 pr-4">{a.titulo}</td>
                  <td className="py-2 pr-4">
                    {new Date(a.fechaApertura).toLocaleString('es-SV')}
                  </td>
                  <td className="py-2 pr-4">
                    {new Date(a.fechaCierre).toLocaleString('es-SV')}
                  </td>
                  <td className="py-2 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${ESTADO_BADGE[a.estado] ?? ''}`}>
                      {a.estado}
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap items-start gap-3">
                      {a.estado === 'BORRADOR' && <PublicarButton id={a.id} />}
                      <Link
                        href={`/admin/asambleas/${a.id}/resultados`}
                        className="text-blue-600 hover:underline"
                      >
                        Ver resultados
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}