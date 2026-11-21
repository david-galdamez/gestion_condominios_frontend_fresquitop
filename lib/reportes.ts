import "server-only";
import { apiFetch } from "@/lib/api";
import type {
  AdminReporteDetalle,
  AdminReportesFiltros,
  AdminReportesRespuesta,
  AsignacionReporteRespuesta,
  AsignarReportePayload,
  Reporte,
  ReportesRespuesta,
  ResolverReportePayload,
  ResolverReporteRespuesta,
  Ubicaciones,
} from "@/lib/types/reportes";

// Nunca lanza por fallos de red: devuelve null. El redirect() de apiFetch
// (401) sí se propaga.
async function pedir(path: string, init?: RequestInit): Promise<Response | null> {
  try {
    return await apiFetch(path, init);
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

function esPaginaAdmin(x: unknown): x is AdminReportesRespuesta {
  const r = x as AdminReportesRespuesta | null;
  return (
    !!r &&
    Array.isArray(r.datos) &&
    typeof r.total === "number" &&
    typeof r.pagina === "number" &&
    typeof r.porPagina === "number"
  );
}

function esDetalleAdmin(x: unknown): x is AdminReporteDetalle {
  const r = x as AdminReporteDetalle | null;
  return (
    !!r &&
    typeof r.id === "string" &&
    typeof r.numero === "string" &&
    Array.isArray(r.evidencias) &&
    Array.isArray(r.historial)
  );
}

function extraerMensajeApi(body: unknown, fallback: string): string {
  const m = (body as { message?: string | string[] } | null)?.message;
  if (Array.isArray(m) && m.length > 0) return String(m[0]);
  if (typeof m === "string" && m.trim()) return m;
  return fallback;
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
  if (!esReporte(body)) return { status: "error" };
  return {
    status: "ok",
    data: {
      ...body,
      resueltoEn: body.resueltoEn ?? null,
      comentarioCierre: body.comentarioCierre ?? null,
      historial: Array.isArray(body.historial) ? body.historial : [],
    },
  };
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

// H06 — Endpoints administrativos
export type AdminReportesResultado =
  | { status: "ok"; data: AdminReportesRespuesta }
  | { status: "forbidden" }
  | { status: "error" };

export async function getAdminReportes(
  filtros: AdminReportesFiltros = {},
): Promise<AdminReportesResultado> {
  const q = new URLSearchParams();
  if (filtros.estado) q.set("estado", filtros.estado);
  if (filtros.categoria) q.set("categoria", filtros.categoria);
  if (filtros.pagina && filtros.pagina >= 1) {
    q.set("pagina", String(filtros.pagina));
  }

  const qs = q.toString();
  const res = await pedir(qs ? `admin/reportes?${qs}` : "admin/reportes");
  if (!res) return { status: "error" };
  if (res.status === 403) return { status: "forbidden" };
  if (!res.ok) return { status: "error" };

  const body = await res.json().catch(() => null);
  return esPaginaAdmin(body) ? { status: "ok", data: body } : { status: "error" };
}

export type AdminReporteDetalleResultado =
  | { status: "ok"; data: AdminReporteDetalle }
  | { status: "not_found" }
  | { status: "forbidden" }
  | { status: "error" };

export async function getAdminReporteDetalle(
  id: string,
): Promise<AdminReporteDetalleResultado> {
  const res = await pedir(`admin/reportes/${encodeURIComponent(id)}`);
  if (!res) return { status: "error" };
  if (res.status === 404) return { status: "not_found" };
  if (res.status === 403) return { status: "forbidden" };
  if (!res.ok) return { status: "error" };

  const body = await res.json().catch(() => null);
  if (!esDetalleAdmin(body)) return { status: "error" };
  return {
    status: "ok",
    data: {
      ...body,
      resueltoEn: body.resueltoEn ?? null,
      comentarioCierre: body.comentarioCierre ?? null,
    },
  };
}

export type AsignarReporteApiResultado =
  | { status: "ok"; data: AsignacionReporteRespuesta }
  | { status: "bad_request"; message: string }
  | { status: "conflict"; message: string }
  | { status: "not_found"; message: string }
  | { status: "forbidden" }
  | { status: "error" };

export async function asignarReporteApi(
  id: string,
  payload: AsignarReportePayload,
): Promise<AsignarReporteApiResultado> {
  const res = await pedir(`admin/reportes/${encodeURIComponent(id)}/asignacion`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res) return { status: "error" };

  const body = await res.json().catch(() => null);

  if (res.ok && body && typeof body.id === "string") {
    return { status: "ok", data: body as AsignacionReporteRespuesta };
  }
  if (res.status === 400) {
    return {
      status: "bad_request",
      message: extraerMensajeApi(body, "Asigna prioridad y responsable juntos"),
    };
  }
  if (res.status === 403) return { status: "forbidden" };
  if (res.status === 404) {
    return {
      status: "not_found",
      message: extraerMensajeApi(body, "Reporte no encontrado"),
    };
  }
  if (res.status === 409) {
    return {
      status: "conflict",
      message: extraerMensajeApi(body, "No se puede modificar un reporte resuelto"),
    };
  }
  return { status: "error" };
}

// H24 — Marcar reporte como Resuelto
export type ResolverReporteApiResultado =
  | { status: "ok"; data: ResolverReporteRespuesta }
  | { status: "bad_request"; message: string }
  | { status: "conflict"; message: string }
  | { status: "not_found"; message: string }
  | { status: "forbidden" }
  | { status: "error" };

export async function resolverReporteApi(
  id: string,
  payload: ResolverReportePayload,
): Promise<ResolverReporteApiResultado> {
  const res = await pedir(`admin/reportes/${encodeURIComponent(id)}/resolver`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res) return { status: "error" };

  const body = await res.json().catch(() => null);

  if (res.ok && body && typeof body.id === "string") {
    return { status: "ok", data: body as ResolverReporteRespuesta };
  }
  if (res.status === 400) {
    return {
      status: "bad_request",
      message: extraerMensajeApi(
        body,
        "El comentario debe tener entre 10 y 300 caracteres",
      ),
    };
  }
  if (res.status === 403) return { status: "forbidden" };
  if (res.status === 404) {
    return {
      status: "not_found",
      message: extraerMensajeApi(body, "Reporte no encontrado"),
    };
  }
  if (res.status === 409) {
    return {
      status: "conflict",
      message: extraerMensajeApi(
        body,
        "Solo se pueden resolver reportes En proceso",
      ),
    };
  }
  return { status: "error" };
}