import Link from "next/link";

export default function AdminReporteNoEncontrado() {
  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="text-2xl font-semibold">Reporte no encontrado</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        El reporte que buscas no existe o fue removido.
      </p>
      <Link
        href="/admin/reportes"
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
      >
        Volver a reportes
      </Link>
    </div>
  );
}