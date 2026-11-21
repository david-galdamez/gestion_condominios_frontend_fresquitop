import type { Metadata } from "next";
import { requireRol } from "@/lib/auth";
import { hoyEnElSalvador, sumarDias } from "@/lib/format";
import { DIAS_MAX_VISITA } from "@/lib/validaciones/visita";
import { getUnidadesMias } from "@/lib/visitas";
import { ReintentarButton } from "../../estado-cuenta/reintentar-button";
import { VisitaForm } from "./visita-form";

export const metadata: Metadata = { title: "Nueva visita" };

export default async function NuevaVisitaPage() {
  await requireRol("RESIDENTE");
  const r = await getUnidadesMias();

  if (r.status === "forbidden") {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Autorizar una visita</h1>
        <p role="alert">No tienes permiso para esta acción</p>
      </div>
    );
  }

  if (r.status !== "ok") {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Autorizar una visita</h1>
        <p role="alert">No pudimos cargar tus unidades. Intenta de nuevo.</p>
        <ReintentarButton />
      </div>
    );
  }

  // El rango se calcula en el servidor (hora de El Salvador) para que no
  // dependa de la zona horaria del navegador.
  const hoy = hoyEnElSalvador();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Autorizar una visita</h1>
      {r.data.length === 0 ? (
        <p role="alert">No tienes unidades asignadas</p>
      ) : (
        <VisitaForm
          unidades={r.data}
          hoy={hoy}
          maxFecha={sumarDias(hoy, DIAS_MAX_VISITA)}
        />
      )}
    </div>
  );
}
