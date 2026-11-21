import type { Metadata } from "next";
import Link from "next/link";
import { getAreas } from "@/lib/areas";
import { requireRol } from "@/lib/auth";
import { ReintentarButton } from "../../estado-cuenta/reintentar-button";
import { ListaAreas } from "./lista-areas";

export const metadata: Metadata = { title: "Áreas comunes" };

const btnPrimario =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background";

const AVISOS: Record<string, string> = {
  creada: "Área registrada",
  editada: "Cambios guardados",
};

export default async function AreasPage({
  searchParams,
}: PageProps<"/admin/areas">) {
  await requireRol("ADMINISTRADOR");
  const { ok } = await searchParams;
  const aviso = typeof ok === "string" ? AVISOS[ok] : undefined;
  const r = await getAreas();

  if (r.status === "forbidden") {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Áreas comunes</h1>
        <p role="alert">No tienes permiso para esta acción</p>
      </div>
    );
  }

  if (r.status !== "ok") {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Áreas comunes</h1>
        <p role="alert">No pudimos cargar las áreas. Intenta de nuevo.</p>
        <ReintentarButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Áreas comunes</h1>
        <Link href="/admin/areas/nueva" className={btnPrimario}>
          Nueva área
        </Link>
      </div>

      {aviso && (
        <p
          role="status"
          className="rounded-md border border-green-600/40 bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-200"
        >
          {aviso}
        </p>
      )}

      {r.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-zinc-600 dark:text-zinc-400">
          <p>Aún no hay áreas registradas</p>
          <Link href="/admin/areas/nueva" className="underline">
            Registra la primera área
          </Link>
        </div>
      ) : (
        <ListaAreas areas={r.data} />
      )}
    </div>
  );
}
