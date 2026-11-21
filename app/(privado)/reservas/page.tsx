import type { Metadata } from "next";
import Link from "next/link";
import { requireRol } from "@/lib/auth";
import { getMisReservas } from "@/lib/reservas";
import { ReintentarButton } from "../estado-cuenta/reintentar-button";
import { ListaReservas } from "./lista-reservas";

export const metadata: Metadata = { title: "Mis reservas" };

const btnPrimario =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background";

export default async function ReservasPage() {
  await requireRol("RESIDENTE");
  const r = await getMisReservas();

  if (r.status === "forbidden") {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Mis reservas</h1>
        <p role="alert">No tienes permiso para esta acción</p>
      </div>
    );
  }

  if (r.status !== "ok") {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Mis reservas</h1>
        <p role="alert">No pudimos cargar tus reservas. Intenta de nuevo.</p>
        <ReintentarButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Mis reservas</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/reservas/disponibilidad"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
          >
            Ver disponibilidad
          </Link>
          <Link href="/reservas/nueva" className={btnPrimario}>
            Nueva reserva
          </Link>
        </div>
      </div>

      {r.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-zinc-600 dark:text-zinc-400">
          <p>Aún no tienes reservas</p>
          <Link href="/reservas/nueva" className="underline">
            Reserva tu primera área
          </Link>
        </div>
      ) : (
        <ListaReservas reservas={r.data} />
      )}
    </div>
  );
}
