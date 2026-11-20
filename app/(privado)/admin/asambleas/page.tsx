import type { Metadata } from 'next';
import Link from 'next/link';
import { requireRol } from '@/lib/auth';

export const metadata: Metadata = { title: 'Asambleas' };

export default async function AsambleasPage() {
  await requireRol('ADMINISTRADOR');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Asambleas</h1>
        <Link
          href="/admin/asambleas/nuevo"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Nueva asamblea
        </Link>
      </div>

      <div className="rounded-md border border-zinc-300 p-6 text-center dark:border-zinc-700">
        <p className="text-zinc-600 dark:text-zinc-400">
          La lista de asambleas estará disponible próximamente.
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Mientras tanto, puedes crear una nueva asamblea desde el botón de arriba.
        </p>
      </div>
    </div>
  );
}