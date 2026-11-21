import type { EstadoAutorizacion } from "@/lib/types/visitas";

const ESTILOS: Record<EstadoAutorizacion, { label: string; clase: string }> = {
  VIGENTE: {
    label: "Vigente",
    clase: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  },
  USADA: {
    label: "Usada",
    clase: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  },
  CANCELADA: {
    label: "Cancelada",
    clase: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  },
  VENCIDA: {
    label: "Vencida",
    clase: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  },
};

export function EstadoAutorizacionBadge({
  estado,
}: {
  estado: EstadoAutorizacion;
}) {
  const e = ESTILOS[estado] ?? { label: estado, clase: "bg-zinc-100" };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${e.clase}`}
    >
      {e.label}
    </span>
  );
}
