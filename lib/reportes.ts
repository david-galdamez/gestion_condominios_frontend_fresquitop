import "server-only";
import { apiFetch } from "@/lib/api";
import type {
  Reporte,
  ReportesRespuesta,
  Ubicaciones,
} from "@/lib/types/reportes";

// Nunca lanza por fallos de red: devuelve null. El redirect() de apiFetch
// (401) sí se propaga.
async function pedir(path: string): Promise<Response | null> {
  try {
    return await apiFetch(path);
  } catch (e) {
    if (e instanceof Error && !("digest" in e)) return null;
    throw e;
  }
}

function esPagina(x: unknown): x is ReportesRespuesta {
  const r = x as ReportesRespuesta | null;
  return (
    !!r &&
    Array.isArray(r.datos) &&
    typeof r.total === "number" &&
    typeof r.pagina === "number" &&
    typeof r.porPagina === "number"
  );
}

function esReporte(x: unknown): x is Reporte {
  const r = x as Reporte | null;
  return (
    !!r &&
    typeof r.numero === "string" &&
    typeof r.titulo === "string" &&
    Array.isArray(r.fotos)
  );
}

function esUbicaciones(x: unknown): x is Ubicaciones {
  const u = x as Ubicaciones | null;
  return !!u && Array.isArray(u.torres) && Array.isArray(u.areasComunes);
}

export type MisReportesResultado =
  | { status: "ok"; data: ReportesRespuesta }
  | { status: "error" };

export async function getMisReportes(
  pagina = 1,
): Promise<MisReportesResultado> {
  const res = await pedir(`reportes?pagina=${pagina}`);
  if (!res || !res.ok) return { status: "error" };
  const body = await res.json().catch(() => null);
  return esPagina(body) ? { status: "ok", data: body } : { status: "error" };
}

export type ReporteResultado =
  | { status: "ok"; data: Reporte }
  | { status: "not_found" }
  | { status: "error" };

export async function getReporte(numero: string): Promise<ReporteResultado> {
  const res = await pedir(`reportes/${encodeURIComponent(numero)}`);
  if (!res) return { status: "error" };
  if (res.status === 404) return { status: "not_found" };
  if (!res.ok) return { status: "error" };
  const body = await res.json().catch(() => null);
  return esReporte(body) ? { status: "ok", data: body } : { status: "error" };
}

export type UbicacionesResultado =
  | { status: "ok"; data: Ubicaciones }
  | { status: "error" };

export async function getUbicaciones(): Promise<UbicacionesResultado> {
  const res = await pedir("reportes/ubicaciones");
  if (!res || !res.ok) return { status: "error" };
  const body = await res.json().catch(() => null);
  return esUbicaciones(body) ? { status: "ok", data: body } : { status: "error" };
}
