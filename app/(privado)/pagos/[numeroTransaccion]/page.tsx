import type { Metadata } from "next";
import Link from "next/link";
import { requireRol } from "@/lib/auth";
import { formatPeriodo, formatUsd } from "@/lib/format";
import { getComprobante } from "@/lib/pagos";
import { ReintentarButton } from "../../estado-cuenta/reintentar-button";

export const metadata: Metadata = { title: "Comprobante de pago" };

const fechaHora = new Intl.DateTimeFormat("es-SV", {
  timeZone: "America/El_Salvador",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

// ISO (UTC) -> "17/11/2026 18:40" en hora de El Salvador.
function formatFechaPago(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : fechaHora.format(d).replace(",", "");
}

const volver = (
  <Link
    href="/estado-cuenta"
    className="rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
  >
    Volver al estado de cuenta
  </Link>
);

export default async function ComprobantePage({
  params,
}: PageProps<"/pagos/[numeroTransaccion]">) {
  await requireRol("RESIDENTE");
  const { numeroTransaccion } = await params;
  const r = await getComprobante(numeroTransaccion);

  if (r.status === "not_found" || r.status === "forbidden") {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Comprobante de pago</h1>
        <p role="alert">No encontramos este comprobante</p>
        {volver}
      </div>
    );
  }

  if (r.status !== "ok") {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Comprobante de pago</h1>
        <p role="alert">No pudimos cargar el comprobante. Intenta de nuevo.</p>
        <ReintentarButton />
      </div>
    );
  }

  const p = r.data;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Comprobante de pago</h1>
      <section
        aria-label="Comprobante"
        className="flex max-w-md flex-col gap-4 rounded-xl border border-green-600/40 bg-green-50 p-6 dark:bg-green-950"
      >
        <p className="font-semibold text-green-800 dark:text-green-200">✔ Pago aprobado</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-zinc-600 dark:text-zinc-400">Transacción</dt>
          <dd className="font-mono">{p.numeroTransaccion}</dd>
          <dt className="text-zinc-600 dark:text-zinc-400">Fecha</dt>
          <dd className="tabular-nums">{formatFechaPago(p.fecha)}</dd>
          <dt className="text-zinc-600 dark:text-zinc-400">Unidad</dt>
          <dd>{p.unidad}</dd>
          <dt className="text-zinc-600 dark:text-zinc-400">Tarjeta</dt>
          <dd className="tabular-nums">•••• {p.ultimos4}</dd>
          <dt className="text-zinc-600 dark:text-zinc-400">Monto</dt>
          <dd className="font-semibold tabular-nums">{formatUsd(p.monto)}</dd>
        </dl>
        <div>
          <h2 className="mb-1 text-sm font-medium">Cuotas pagadas</h2>
          <ul className="text-sm">
            {p.cuotas.map((c) => (
              <li key={c.periodo} className="flex justify-between tabular-nums">
                <span>{formatPeriodo(c.periodo)}</span>
                <span>{formatUsd(c.monto)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <div>{volver}</div>
    </div>
  );
}
