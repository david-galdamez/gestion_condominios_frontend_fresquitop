import "server-only";
import { apiFetch } from "@/lib/api";
import type {
  MorosidadFiltros,
  MorosidadRespuesta,
} from "@/lib/types/morosidad";

export type MorosidadResultado =
  | { status: "ok"; data: MorosidadRespuesta }
  | { status: "forbidden" }
  | { status: "not_found"; message: string }
  | { status: "bad_request"; message: string }
  | { status: "error" };

function esRespuestaValida(x: unknown): x is MorosidadRespuesta {
  const r = x as MorosidadRespuesta | null;
  return (
    !!r &&
    Array.isArray(r.datos) &&
    typeof r.totalMora === "number" &&
    typeof r.unidadesMorosas === "number" &&
    typeof r.total === "number" &&
    typeof r.pagina === "number"
  );
}

// Consulta el reporte de morosidad en GET /api/v1/admin/morosidad.
// Solo envía parámetros definidos y traduce errores de red o de servidor a status "error".
export async function getMorosidad(
  filtros: MorosidadFiltros = {},
): Promise<MorosidadResultado> {
  const query = new URLSearchParams();
  if (filtros.torreId) query.set("torreId", filtros.torreId);
  if (filtros.pagina) query.set("pagina", String(filtros.pagina));
  const qs = query.toString();

  let res: Response;
  try {
    res = await apiFetch(`admin/morosidad${qs ? `?${qs}` : ""}`);
  } catch (e) {
    // Propaga el redirect() lanzado por apiFetch ante un 401.
    if (e instanceof Error && !("digest" in e)) return { status: "error" };
    throw e;
  }

  if (res.status === 403) return { status: "forbidden" };

  if (res.status === 404) {
    const body = await res.json().catch(() => null);
    const message =
      typeof body?.message === "string" ? body.message : "Torre no encontrada";
    return { status: "not_found", message };
  }

  if (res.status === 400) {
    const body = await res.json().catch(() => null);
    const m = body?.message;
    const message = Array.isArray(m)
      ? m.join(". ")
      : typeof m === "string"
        ? m
        : "Los filtros no son válidos.";
    return { status: "bad_request", message };
  }

  if (!res.ok) return { status: "error" };

  const body = await res.json().catch(() => null);
  if (!esRespuestaValida(body)) return { status: "error" };
  return { status: "ok", data: body };
}