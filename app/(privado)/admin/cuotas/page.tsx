import type { Metadata } from "next";
import { requireRol } from "@/lib/auth";
import { getConfiguracionCuota } from "@/lib/cuotas";
import { periodosGenerables } from "@/lib/validaciones/cuota";
import { ReintentarButton } from "../../estado-cuenta/reintentar-button";
import { ConfiguracionForm } from "./configuracion-form";
import { GenerarForm } from "./generar-form";

export const metadata: Metadata = { title: "Cuotas de mantenimiento" };

const TITULO = "Cuotas de mantenimiento";

export default async function CuotasPage() {
  await requireRol("ADMINISTRADOR");
  const r = await getConfiguracionCuota();

  if (r.status === "forbidden") {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{TITULO}</h1>
        <p role="alert">No tienes permiso para esta acción</p>
      </div>
    );
  }

  // 404 = todavía no hay configuración: se muestra el formulario vacío.
  if (r.status !== "ok" && r.status !== "not_found") {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">{TITULO}</h1>
        <p role="alert">No pudimos cargar la configuración. Intenta de nuevo.</p>
        <ReintentarButton />
      </div>
    );
  }

  const configuracion = r.status === "ok" ? r.data : null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{TITULO}</h1>
      <ConfiguracionForm configuracion={configuracion} />
      <GenerarForm
        periodos={periodosGenerables()}
        habilitado={configuracion !== null}
      />
    </div>
  );
}
