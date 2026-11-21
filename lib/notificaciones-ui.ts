import { MODULOS_ORIGEN, type ModuloOrigen } from "@/lib/types/notificaciones";

export type ModuloOrigenMeta = {
  modulo: ModuloOrigen | null;
  etiqueta: string;
  clases: string;
};

export const MODULO_ORIGEN_LABEL: Record<ModuloOrigen, string> = {
  PAGOS: "Pagos",
  RESERVAS: "Reservas",
  INCIDENCIAS: "Incidencias",
  VISITAS: "Visitas",
  PAQUETERIA: "Paquetería",
  VOTACIONES: "Votaciones",
  COMUNICADOS: "Comunicados",
};

export const MODULO_ORIGEN_CLASES: Record<ModuloOrigen, string> = {
  PAGOS:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  RESERVAS: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  INCIDENCIAS:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  VISITAS:
    "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  PAQUETERIA:
    "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  VOTACIONES:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  COMUNICADOS: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
};

export const MODULO_ORIGEN_FALLBACK_CLASES =
  "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";

const MODULOS_SET = new Set<string>(MODULOS_ORIGEN);

export function esModuloOrigen(valor: string): valor is ModuloOrigen {
  return MODULOS_SET.has(valor);
}

export function obtenerMetaModuloOrigen(
  moduloOrigen: string,
): ModuloOrigenMeta {
  const limpio = moduloOrigen.trim();
  const normalizado = limpio.toUpperCase();

  if (esModuloOrigen(normalizado)) {
    return {
      modulo: normalizado,
      etiqueta: MODULO_ORIGEN_LABEL[normalizado],
      clases: MODULO_ORIGEN_CLASES[normalizado],
    };
  }

  return {
    modulo: null,
    etiqueta: limpio || "General",
    clases: MODULO_ORIGEN_FALLBACK_CLASES,
  };
}