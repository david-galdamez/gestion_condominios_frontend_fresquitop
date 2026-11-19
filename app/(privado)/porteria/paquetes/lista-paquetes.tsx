import { hoyEnElSalvador } from "@/lib/format";
import type { EstadoPaquete, Paquete } from "@/lib/types/paquetes";
import { etiquetaMensajeria } from "@/lib/validaciones/paquete";
import { EntregarPaquete } from "./entregar-paquete";

const ESTADO: Record<EstadoPaquete, { texto: string; clase: string }> = {
  EN_PORTERIA: {
    texto: "En portería",
    clase: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  },
  RETENIDO: {
    texto: "Retenido",
    clase: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  },
  ENTREGADO: {
    texto: "Entregado",
    clase: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  },
};

const fechaHora = new Intl.DateTimeFormat("es-SV", {
  timeZone: "America/El_Salvador",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

// ISO (UTC) -> "04/11/2026 18:40" en hora de El Salvador.
export function formatLlegada(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : fechaHora.format(d).replace(",", "");
}

// Días completos que lleva el paquete en portería (por fecha de calendario en
// hora de El Salvador: llegó ayer = 1 día). H10: a los 7 días pasa a Retenido.
export function diasEnPorteria(recibidoEn: string, ahora: Date = new Date()) {
  const llegada = new Date(recibidoEn);
  if (Number.isNaN(llegada.getTime())) return 0;
  const aMs = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
  const dias = (aMs(hoyEnElSalvador(ahora)) - aMs(hoyEnElSalvador(llegada))) / 86_400_000;
  return Math.max(0, Math.round(dias));
}

const textoDias = (n: number) =>
  n === 0 ? "Llegó hoy" : n === 1 ? "1 día en portería" : `${n} días en portería`;

// Nunca muestra el código de retiro: el backend no lo manda a seguridad.
export function ListaPaquetes({ paquetes }: { paquetes: Paquete[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="py-2 pr-4 font-medium">Código</th>
            <th className="py-2 pr-4 font-medium">Unidad</th>
            <th className="py-2 pr-4 font-medium">Destinatario</th>
            <th className="py-2 pr-4 font-medium">Mensajería</th>
            <th className="py-2 pr-4 font-medium">Llegada</th>
            <th className="py-2 pr-4 font-medium">Estado</th>
            <th className="py-2 font-medium">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {paquetes.map((p) => (
            <tr
              key={p.id}
              className="border-b border-zinc-100 dark:border-zinc-900"
            >
              <td className="py-2 pr-4 font-mono tabular-nums">
                {p.codigoPaquete}
              </td>
              <td className="py-2 pr-4">{p.unidad}</td>
              <td className="py-2 pr-4">{p.destinatario}</td>
              <td className="py-2 pr-4">
                {etiquetaMensajeria(p.mensajeria)}
                {p.guia && (
                  <span className="block text-xs text-zinc-500">
                    Guía {p.guia}
                  </span>
                )}
              </td>
              <td className="py-2 pr-4 tabular-nums">
                {formatLlegada(p.recibidoEn)}
              </td>
              <td className="py-2 pr-4">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO[p.estado]?.clase ?? ""}`}
                >
                  {ESTADO[p.estado]?.texto ?? p.estado}
                </span>
                <span className="mt-1 block text-xs text-zinc-500">
                  {textoDias(diasEnPorteria(p.recibidoEn))}
                </span>
              </td>
              <td className="py-2 text-right">
                {p.estado !== "ENTREGADO" && <EntregarPaquete paquete={p} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
