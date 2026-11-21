import Link from "next/link";

export default function ComunicadoNoEncontrado() {
  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="text-2xl font-semibold">Comunicado no encontrado</h1>
      <Link
        href="/comunicados"
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
      >
        Volver a comunicados
      </Link>
    </div>
  );
}
