import type { Metadata } from "next";
import Link from "next/link";
import { requireRol } from "@/lib/auth";
import { getComunicados } from "@/lib/comunicados";
import { ReintentarButton } from "../../estado-cuenta/reintentar-button";
import { ListaComunicados } from "./lista-comunicados";

export const metadata: Metadata = { title: "Comunicados" };

const AVISOS: Record<string, string> = {
  publicado: "Comunicado publicado.",
  programado: "Comunicado programado.",
};

export default async function ComunicadosPage({
  searchParams,
}: PageProps<"/admin/comunicados">) {
  await requireRol("ADMINISTRADOR");
  const { ok } = await searchParams;
  const aviso = typeof ok === "string" ? AVISOS[ok] : undefined;
  const r = await getComunicados();

  if (r.status === "forbidden") {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Comunicados</h1>
        <p role="alert">No tienes permiso para esta acción</p>
      </div>
    );
  }

  if (r.status !== "ok") {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Comunicados</h1>
        <p role="alert">No pudimos cargar los comunicados. Intenta de nuevo.</p>
        <ReintentarButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Comunicados</h1>
        <Link
          href="/admin/comunicados/nuevo"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Nuevo comunicado
        </Link>
      </div>
      {aviso && (
        <p role="status" className="text-sm text-green-700 dark:text-green-400">
          {aviso}
        </p>
      )}
      {r.data.length === 0 ? (
        <p className="py-8 text-center text-zinc-600 dark:text-zinc-400">
          Aún no hay comunicados
        </p>
      ) : (
        <ListaComunicados comunicados={r.data} />
      )}
    </div>
  );
}
