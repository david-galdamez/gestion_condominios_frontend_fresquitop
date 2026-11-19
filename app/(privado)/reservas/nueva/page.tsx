import type { Metadata } from "next";
import { requireRol } from "@/lib/auth";
import { horaActualEnElSalvador, hoyEnElSalvador } from "@/lib/format";
import { getAreasReservables } from "@/lib/reservas";
import { ReintentarButton } from "../../estado-cuenta/reintentar-button";
import { ReservaForm } from "./reserva-form";

export const metadata: Metadata = { title: "Nueva reserva" };

export default async function NuevaReservaPage() {
  await requireRol("RESIDENTE");
  const r = await getAreasReservables();

  if (r.status === "forbidden") {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Reservar un área común</h1>
        <p role="alert">No tienes permiso para esta acción</p>
      </div>
    );
  }

  if (r.status !== "ok") {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Reservar un área común</h1>
        <p role="alert">No pudimos cargar las áreas. Intenta de nuevo.</p>
        <ReintentarButton />
      </div>
    );
  }

  // "Ahora" se calcula en el servidor (hora de El Salvador) para que no
  // dependa de la zona horaria del navegador.
  const ahora = { hoy: hoyEnElSalvador(), hora: horaActualEnElSalvador() };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Reservar un área común</h1>
      {r.data.length === 0 ? (
        <p role="alert">No hay áreas disponibles para reservar</p>
      ) : (
        <ReservaForm areas={r.data} ahora={ahora} />
      )}
    </div>
  );
}
