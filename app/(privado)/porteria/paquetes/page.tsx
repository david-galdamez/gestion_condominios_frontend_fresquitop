import type { Metadata } from "next";
import Link from "next/link";
import { requireRol } from "@/lib/auth";
import { getPaquetesPorteria } from "@/lib/paquetes";
import { ReintentarButton } from "../../estado-cuenta/reintentar-button";
import { ActualizarButton } from "./actualizar-button";
import { ListaPaquetes } from "./lista-paquetes";

export const metadata: Metadata = { title: "Paquetes en portería" };

const btnPrimario =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background";
const CODIGO = /^PAQ-\d{6}$/;

export default async function PaquetesPage({
  searchParams,
}: PageProps<"/porteria/paquetes">) {
  await requireRol("SEGURIDAD");
  const { registrado, unidad } = await searchParams;
  // Solo se muestra si tiene la forma esperada (viene en la URL).
  const aviso =
    typeof registrado === "string" && CODIGO.test(registrado)
      ? `Paquete ${registrado} registrado.${typeof unidad === "string" ? ` Se avisó a la unidad ${unidad}.` : ""}`
      : undefined;
  const r = await getPaquetesPorteria();

  const encabezado = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-semibold">Paquetes en portería</h1>
      <div className="flex gap-2">
        <Link href="/porteria/paquetes/nuevo" className={btnPrimario}>
          Registrar paquete
        </Link>
        <ActualizarButton />
      </div>
    </div>
  );

  if (r.status === "forbidden") {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Paquetes en portería</h1>
        <p role="alert">No tienes permiso para esta acción</p>
      </div>
    );
  }

  if (r.status !== "ok") {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Paquetes en portería</h1>
        <p role="alert">No pudimos cargar los paquetes. Intenta de nuevo.</p>
        <ReintentarButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {encabezado}

      {aviso && (
        <p
          role="status"
          className="rounded-md border border-green-600/40 bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-200"
        >
          {aviso}
        </p>
      )}

      {r.data.length === 0 ? (
        <p className="py-8 text-center text-zinc-600 dark:text-zinc-400">
          No hay paquetes en portería
        </p>
      ) : (
        <ListaPaquetes paquetes={r.data} />
      )}
    </div>
  );
}
