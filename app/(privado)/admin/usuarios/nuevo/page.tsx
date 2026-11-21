import type { Metadata } from "next";
import { requireRol } from "@/lib/auth";
import { getUnidadesActivas } from "@/lib/usuarios";
import { ReintentarButton } from "../../../estado-cuenta/reintentar-button";
import { UsuarioForm } from "./usuario-form";

export const metadata: Metadata = { title: "Nuevo residente" };

export default async function NuevoResidentePage({
  searchParams,
}: PageProps<"/admin/usuarios/nuevo">) {
  await requireRol("ADMINISTRADOR");
  const { ok } = await searchParams;
  const r = await getUnidadesActivas();

  if (r.status !== "ok") {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Nuevo residente</h1>
        <p role="alert">No pudimos cargar las unidades. Intenta de nuevo.</p>
        <ReintentarButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nuevo residente</h1>
      {ok === "creado" && (
        <p
          role="status"
          className="rounded-md border border-green-600/40 bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-200"
        >
          Residente registrado
        </p>
      )}
      <UsuarioForm unidades={r.data} />
    </div>
  );
}
