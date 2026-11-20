import type { Metadata } from "next";
import Link from "next/link";
import { requireRol } from "@/lib/auth";
import { getDisponibilidad } from "@/lib/disponibilidad";
import { hoyEnElSalvador } from "@/lib/format";
import type { AreaDisponibilidad } from "@/lib/types/disponibilidad";
import {
  fechaConsultable,
  MSG_DISPONIBILIDAD as MSG,
} from "@/lib/validaciones/disponibilidad";
import { ReintentarButton } from "../../estado-cuenta/reintentar-button";
import { DisponibilidadVista } from "./disponibilidad-vista";

export const metadata: Metadata = { title: "Disponibilidad de áreas" };

const encabezado = (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <h1 className="text-2xl font-semibold">Disponibilidad de áreas</h1>
    <Link href="/reservas" className="text-sm underline">
      Mis reservas
    </Link>
  </div>
);

export default async function DisponibilidadPage({
  searchParams,
}: PageProps<"/reservas/disponibilidad">) {
  await requireRol("RESIDENTE");
  const sp = await searchParams;
  const hoy = hoyEnElSalvador();
  const fecha = typeof sp.fecha === "string" && sp.fecha ? sp.fecha : hoy;
  const areaId = typeof sp.areaId === "string" ? sp.areaId : "";

  // key={fecha}: al llegar una fecha nueva se reinicia el estado de la vista.
  const vista = (areas: AreaDisponibilidad[], aviso?: string) => (
    <div className="flex flex-col gap-6">
      {encabezado}
      <DisponibilidadVista
        key={fecha}
        hoy={hoy}
        fecha={fecha}
        areaId={areaId}
        areas={areas}
        aviso={aviso}
      />
    </div>
  );

  // Una fecha fuera de rango en la URL no llega al backend.
  if (!fechaConsultable(fecha, hoy)) return vista([], MSG.fueraDeRango);

  const r = await getDisponibilidad(fecha);

  if (r.status === "forbidden") {
    return (
      <div className="flex flex-col gap-2">
        {encabezado}
        <p role="alert">{MSG.sinPermiso}</p>
      </div>
    );
  }

  // El backend valida el mismo rango (puede cambiar el día entre ambos).
  if (r.status === "bad_request") return vista([], MSG.fueraDeRango);

  if (r.status !== "ok") {
    return (
      <div className="flex flex-col items-start gap-3">
        {encabezado}
        <p role="alert">{MSG.error}</p>
        <ReintentarButton />
      </div>
    );
  }

  return vista(r.data.areas);
}
