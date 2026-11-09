import type { MorosidadFiltros } from "@/lib/types/morosidad";

export type SearchParams = { [key: string]: string | string[] | undefined };

const primero = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

// Normaliza los search params de la URL para la consulta de morosidad.
export function leerFiltros(sp: SearchParams): MorosidadFiltros {
  const torreRaw = primero(sp.torreId)?.trim();
  const pagina = Number(primero(sp.pagina));

  return {
    torreId: torreRaw ? torreRaw : undefined,
    pagina: Number.isInteger(pagina) && pagina >= 1 ? pagina : undefined,
  };
}