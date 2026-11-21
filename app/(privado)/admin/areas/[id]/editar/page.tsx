import type { Metadata } from "next";
import Link from "next/link";
import { getAreas } from "@/lib/areas";
import { requireRol } from "@/lib/auth";
import { ReintentarButton } from "../../../../estado-cuenta/reintentar-button";
import { AreaForm } from "../../area-form";

export const metadata: Metadata = { title: "Editar área" };

export default async function EditarAreaPage({
  params,
}: PageProps<"/admin/areas/[id]/editar">) {
  await requireRol("ADMINISTRADOR");
  const { id } = await params;
  // El backend no expone GET /areas/:id: se busca en la lista (son pocas).
  const r = await getAreas();

  if (r.status === "forbidden") {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Editar área</h1>
        <p role="alert">No tienes permiso para esta acción</p>
      </div>
    );
  }

  if (r.status !== "ok") {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Editar área</h1>
        <p role="alert">No pudimos cargar el área. Intenta de nuevo.</p>
        <ReintentarButton />
      </div>
    );
  }

  const area = r.data.find((a) => a.id === id);
  if (!area) {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Editar área</h1>
        <p role="alert">El área no existe</p>
        <Link href="/admin/areas" className="underline">
          Volver a las áreas
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Editar área</h1>
      <AreaForm area={area} />
    </div>
  );
}
