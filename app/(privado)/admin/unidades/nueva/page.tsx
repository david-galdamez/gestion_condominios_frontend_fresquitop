import type { Metadata } from "next";
import { requireRol } from "@/lib/auth";
import { getTorres } from "@/lib/usuarios";
import { ReintentarButton } from "../../../estado-cuenta/reintentar-button";
import { UnidadForm } from "./unidad-form";

export const metadata: Metadata = { title: "Nueva unidad" };

export default async function NuevaUnidadPage({
  searchParams,
}: PageProps<"/admin/unidades/nueva">) {
  await requireRol("ADMINISTRADOR");
  const { ok } = await searchParams;
  const r = await getTorres();

  if (r.status !== "ok") {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Nueva unidad</h1>
        <p role="alert">No pudimos cargar las torres. Intenta de nuevo.</p>
        <ReintentarButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nueva unidad</h1>
      {ok === "creada" && (
        <p
          role="status"
          className="rounded-md border border-green-600/40 bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-200"
        >
          Unidad registrada
        </p>
      )}
      <UnidadForm torres={r.data} />
    </div>
  );
}
