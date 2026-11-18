import type { Metadata } from "next";
import { requireRol } from "@/lib/auth";
import { getTorres } from "@/lib/comunicados";
import { aLocalSv } from "@/lib/validaciones/comunicado";
import { ReintentarButton } from "../../../estado-cuenta/reintentar-button";
import { ComunicadoForm } from "./comunicado-form";

export const metadata: Metadata = { title: "Nuevo comunicado" };

export default async function NuevoComunicadoPage() {
  await requireRol("ADMINISTRADOR");
  const r = await getTorres();

  if (r.status === "forbidden") {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Nuevo comunicado</h1>
        <p role="alert">No tienes permiso para esta acción</p>
      </div>
    );
  }

  if (r.status !== "ok") {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Nuevo comunicado</h1>
        <p role="alert">No pudimos cargar las torres. Intenta de nuevo.</p>
        <ReintentarButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nuevo comunicado</h1>
      <ComunicadoForm torres={r.data} ahora={aLocalSv(new Date())} />
    </div>
  );
}
