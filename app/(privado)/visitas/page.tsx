import type { Metadata } from "next";
import Link from "next/link";
import { requireRol } from "@/lib/auth";
import { getMisAutorizaciones } from "@/lib/visitas";
import { ReintentarButton } from "../estado-cuenta/reintentar-button";
import { ListaVisitas } from "./lista-visitas";

export const metadata: Metadata = { title: "Mis visitas" };

const btnPrimario =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background";

export default async function VisitasPage() {
  await requireRol("RESIDENTE");
  const r = await getMisAutorizaciones();

  if (r.status === "forbidden") {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Mis visitas</h1>
        <p role="alert">No tienes permiso para esta acción</p>
      </div>
    );
  }

  if (r.status !== "ok") {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Mis visitas</h1>
        <p role="alert">No pudimos cargar tus visitas. Intenta de nuevo.</p>
        <ReintentarButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Mis visitas</h1>
        <Link href="/visitas/nueva" className={btnPrimario}>
          Nueva visita
        </Link>
      </div>

      {r.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-zinc-600 dark:text-zinc-400">
          <p>Aún no has autorizado visitas</p>
          <Link href="/visitas/nueva" className="underline">
            Autoriza tu primera visita
          </Link>
        </div>
      ) : (
        <ListaVisitas autorizaciones={r.data} />
      )}
    </div>
  );
}
