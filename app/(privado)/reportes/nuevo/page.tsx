import type { Metadata } from "next";
import Link from "next/link";
import { requireRol } from "@/lib/auth";
import { getUbicaciones } from "@/lib/reportes";
import { ReporteForm } from "./reporte-form";

export const metadata: Metadata = { title: "Reportar un problema" };

export default async function NuevoReportePage() {
  await requireRol("RESIDENTE");
  const r = await getUbicaciones();

  if (r.status === "error") {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Reportar un problema</h1>
        <p role="alert">No pudimos cargar el formulario. Intenta de nuevo.</p>
        <Link
          href="/reportes/nuevo"
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          Reintentar
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Reportar un problema</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Cuéntanos qué pasa y adjunta fotos si las tienes; la administración
          lo atenderá.
        </p>
      </div>
      <ReporteForm ubicaciones={r.data} />
    </div>
  );
}
