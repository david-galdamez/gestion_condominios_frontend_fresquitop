import { esFechaValida, hoyEnElSalvador, sumarDias } from "@/lib/format";
import {
  MAX_DIAS_PANEL,
  type PanelPeriodo,
  type PeriodoClave,
} from "@/lib/types/panel";

export type SearchParamsPanel = {
  [key: string]: string | string[] | undefined;
};

const primero = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

// Días entre dos fechas ISO, ambos extremos incluidos.
export function diasEntre(desde: string, hasta: string) {
  const ms = Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`);
  return Math.round(ms / 86_400_000) + 1;
}

// Valida un rango personalizado; devuelve el mensaje de error o null.
export function validarRango(desde: string, hasta: string): string | null {
  if (!esFechaValida(desde) || !esFechaValida(hasta)) {
    return "Indica fechas válidas para el rango.";
  }
  if (desde > hasta) return "La fecha inicial no puede ser posterior a la final.";
  if (diasEntre(desde, hasta) > MAX_DIAS_PANEL) {
    return `El rango no puede superar ${MAX_DIAS_PANEL} días.`;
  }
  return null;
}

// Traduce la URL al periodo consultado. El periodo vive en la URL para que
// H20 (exportar) use exactamente el mismo. Sin parámetros válidos: mes actual.
//  - mes: del día 1 del mes en curso a hoy.
//  - 3m / 12m: los últimos 90 / 365 días hasta hoy.
//  - rango: desde y hasta de la URL; si son inválidos devuelve `error`.
export function resolverPeriodo(
  sp: SearchParamsPanel,
  hoy: string = hoyEnElSalvador(),
): PanelPeriodo & { error?: string } {
  const clave = primero(sp.periodo) as PeriodoClave | undefined;

  if (clave === "3m") return { periodo: "3m", desde: sumarDias(hoy, -89), hasta: hoy };
  if (clave === "12m") return { periodo: "12m", desde: sumarDias(hoy, -364), hasta: hoy };

  if (clave === "rango") {
    const desde = primero(sp.desde)?.trim() ?? "";
    const hasta = primero(sp.hasta)?.trim() ?? "";
    const error = validarRango(desde, hasta);
    if (error) return { periodo: "rango", desde, hasta, error };
    return { periodo: "rango", desde, hasta };
  }

  return { periodo: "mes", desde: `${hoy.slice(0, 8)}01`, hasta: hoy };
}

// Query string del periodo, tal como lo espera el backend.
export function queryDePeriodo({ desde, hasta }: Pick<PanelPeriodo, "desde" | "hasta">) {
  return new URLSearchParams({ desde, hasta }).toString();
}
