import type { EstadoPaquete, Paquete } from "@/lib/types/paquetes";
import { etiquetaMensajeria } from "@/lib/validaciones/paquete";

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
            <th className="py-2 font-medium">Estado</th>
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
              <td className="py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO[p.estado]?.clase ?? ""}`}
                >
                  {ESTADO[p.estado]?.texto ?? p.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
