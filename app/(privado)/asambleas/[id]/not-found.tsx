import Link from 'next/link';

export default function AsambleaNoEncontrada() {
  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="text-2xl font-semibold">Asamblea no encontrada</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        La asamblea que buscas no existe o todavía no ha sido publicada.
      </p>
      <Link
        href="/asambleas"
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        Volver a asambleas
      </Link>
    </div>
  );
}