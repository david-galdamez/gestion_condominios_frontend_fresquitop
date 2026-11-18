import type { Metadata } from "next";
import Link from "next/link";
import { requireRol } from "@/lib/auth";
import { hoyEnElSalvador, sumarDias } from "@/lib/format";
import { DIAS_MAX_VISITA } from "@/lib/validaciones/visita";
import { getAutorizacion } from "@/lib/visitas";
import { ReintentarButton } from "../../../estado-cuenta/reintentar-button";
import { VisitaForm } from "../../nueva/visita-form";

export const metadata: Metadata = { title: "Editar visita" };

const titulo = <h1 className="text-2xl font-semibold">Editar visita</h1>;

function Aviso({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex flex-col items-start gap-3">
      {titulo}
      <p role="alert">{mensaje}</p>
      <Link href="/visitas" className="underline">
        Volver a mis visitas
      </Link>
    </div>
  );
}

export default async function EditarVisitaPage({
  params,
}: PageProps<"/visitas/[id]/editar">) {
  await requireRol("RESIDENTE");
  const { id } = await params;
  const r = await getAutorizacion(id);

  if (r.status === "forbidden") {
    return <Aviso mensaje="No tienes permiso para esta acción" />;
  }
  // Ajena, inexistente o id mal formado: el backend no distingue.
  if (r.status === "not_found" || r.status === "bad_request") {
    return <Aviso mensaje="La autorización no existe" />;
  }
  if (r.status !== "ok") {
    return (
      <div className="flex flex-col items-start gap-3">
        {titulo}
        <p role="alert">No pudimos cargar la visita. Intenta de nuevo.</p>
        <ReintentarButton />
      </div>
    );
  }
  if (r.data.estado !== "VIGENTE") {
    return <Aviso mensaje="Esta autorización ya no se puede editar" />;
  }

  const hoy = hoyEnElSalvador();

  return (
    <div className="flex flex-col gap-6">
      {titulo}
      <VisitaForm
        unidades={[r.data.unidad]}
        hoy={hoy}
        maxFecha={sumarDias(hoy, DIAS_MAX_VISITA)}
        autorizacion={r.data}
      />
    </div>
  );
}
