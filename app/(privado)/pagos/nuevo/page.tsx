import type { Metadata } from "next";
import Link from "next/link";
import { requireRol } from "@/lib/auth";
import { hoyEnElSalvador } from "@/lib/format";
import { getCuotasPorPagar } from "@/lib/pagos";
import { ReintentarButton } from "../../estado-cuenta/reintentar-button";
import { PagoForm } from "./pago-form";

export const metadata: Metadata = { title: "Pagar cuotas" };

const titulo = <h1 className="text-2xl font-semibold">Pagar cuotas</h1>;

export default async function NuevoPagoPage({
  searchParams,
}: PageProps<"/pagos/nuevo">) {
  await requireRol("RESIDENTE");
  const { unidadId, cuota } = await searchParams;
  const r = await getCuotasPorPagar(typeof unidadId === "string" ? unidadId : undefined);

  if (r.status === "forbidden") {
    return (
      <div className="flex flex-col gap-2">
        {titulo}
        <p role="alert">No tienes permiso para esta acción</p>
      </div>
    );
  }

  if (r.status !== "ok") {
    return (
      <div className="flex flex-col items-start gap-3">
        {titulo}
        <p role="alert">No pudimos cargar tus cuotas. Intenta de nuevo.</p>
        <ReintentarButton />
      </div>
    );
  }

  const { unidad, unidades, cuotas } = r.data;
  // Llega desde Estado de cuenta con una cuota ya elegida (solo si es de esta lista).
  const preseleccion =
    typeof cuota === "string" && cuotas.some((c) => c.id === cuota) ? [cuota] : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {titulo}
        {unidades.length > 1 ? (
          <nav aria-label="Unidad" className="flex flex-wrap gap-2 text-sm">
            {unidades.map((u) => (
              <Link
                key={u.id}
                href={`/pagos/nuevo?unidadId=${u.id}`}
                aria-current={u.id === unidad?.id ? "page" : undefined}
                className={
                  u.id === unidad?.id
                    ? "rounded-md bg-foreground px-3 py-1 text-background"
                    : "rounded-md border border-zinc-300 px-3 py-1 dark:border-zinc-700"
                }
              >
                {u.codigo}
              </Link>
            ))}
          </nav>
        ) : (
          unidad && <p className="text-zinc-600 dark:text-zinc-400">Unidad {unidad.codigo}</p>
        )}
      </div>

      {!unidad ? (
        <p role="alert">No tienes unidades asignadas</p>
      ) : cuotas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-zinc-600 dark:text-zinc-400">
          <p>No tienes cuotas pendientes</p>
          <Link href="/estado-cuenta" className="underline">
            Ver mi estado de cuenta
          </Link>
        </div>
      ) : (
        // key: al cambiar de unidad se reinicia el formulario (selección y tarjeta).
        <PagoForm
          key={unidad.id}
          cuotas={cuotas}
          preseleccion={preseleccion}
          mesActual={hoyEnElSalvador().slice(0, 7)}
        />
      )}
    </div>
  );
}
