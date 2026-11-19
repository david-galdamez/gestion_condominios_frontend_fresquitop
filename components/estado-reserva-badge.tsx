import type { EstadoReserva } from "@/lib/types/reservas";

const ESTILOS: Record<EstadoReserva, { label: string; clase: string }> = {
  CONFIRMADA: {
    label: "Confirmada",
    clase: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  },
  CANCELADA: {
    label: "Cancelada",
    clase: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  },
  FINALIZADA: {
    label: "Finalizada",
    clase: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  },
};

export function EstadoReservaBadge({ estado }: { estado: EstadoReserva }) {
  const e = ESTILOS[estado] ?? { label: estado, clase: "bg-zinc-100" };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${e.clase}`}
    >
      {e.label}
    </span>
  );
}
