import type { Metadata } from "next";
import { requireRol } from "@/lib/auth";
import { getUnidades } from "@/lib/paquetes";
import { ReintentarButton } from "../../../estado-cuenta/reintentar-button";
import { VisitanteForm } from "./visitante-form";

export const metadata: Metadata = { title: "Visitante sin pre-autorización" };

const TITULO = "Visitante sin pre-autorización";

export default async function NuevoVisitantePage() {
  await requireRol("SEGURIDAD");
  // Mismo selector de unidades activas que usa portería en paquetes (H09).
  const r = await getUnidades();

  if (r.status === "forbidden") {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{TITULO}</h1>
        <p role="alert">No tienes permiso para esta acción</p>
      </div>
    );
  }

  if (r.status !== "ok") {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">{TITULO}</h1>
        <p role="alert">No pudimos cargar las unidades. Intenta de nuevo.</p>
        <ReintentarButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{TITULO}</h1>
      {r.data.length === 0 ? (
        <p role="alert">No hay unidades registradas</p>
      ) : (
        <VisitanteForm unidades={r.data} />
      )}
    </div>
  );
}
