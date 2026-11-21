// H20 · Lógica de la descarga del reporte, separada del componente para probarla.

export type FormatoExportacion = "PDF" | "EXCEL";
export type VersionExportacion = "RESUMIDA" | "DETALLADA";

export const MSG_SIN_PERIODO = "Selecciona un periodo";
export const MSG_ERROR_EXPORTAR = "No pudimos generar el archivo. Intenta de nuevo.";
export const MSG_SIN_PERMISO = "No tienes permiso para esta acción";

export type ResultadoExportar =
  | { ok: true; archivo: Blob; nombre: string }
  | { ok: false; mensaje: string };

const EXTENSION: Record<FormatoExportacion, string> = { PDF: "pdf", EXCEL: "xlsx" };

// 'attachment; filename="reporte-condominio-2026-11-20.pdf"' -> nombre del archivo.
export function nombreDesdeDisposition(
  disposition: string | null,
  formato: FormatoExportacion,
): string {
  const m = disposition?.match(/filename="?([^";]+)"?/i);
  return m?.[1] ?? `reporte-condominio.${EXTENSION[formato]}`;
}

export function urlExportar(p: {
  formato: FormatoExportacion;
  version: VersionExportacion;
  desde: string;
  hasta: string;
}) {
  return `/api/reportes-condominio/exportar?${new URLSearchParams(p).toString()}`;
}

/** Pide el archivo al route handler; nunca lanza. */
export async function pedirReporte(
  p: Parameters<typeof urlExportar>[0],
  fetcher: typeof fetch = fetch,
): Promise<ResultadoExportar> {
  let res: Response;
  try {
    res = await fetcher(urlExportar(p));
  } catch {
    return { ok: false, mensaje: MSG_ERROR_EXPORTAR };
  }

  const tipo = res.headers.get("content-type") ?? "";
  // Una página HTML (por ejemplo, el login tras expirar la sesión) no es el archivo.
  if (res.ok && !tipo.includes("json") && !tipo.includes("html")) {
    return {
      ok: true,
      archivo: await res.blob(),
      nombre: nombreDesdeDisposition(res.headers.get("content-disposition"), p.formato),
    };
  }

  if (res.status === 403) return { ok: false, mensaje: MSG_SIN_PERMISO };
  if (res.status === 400) {
    const body = await res.json().catch(() => null);
    const m = body?.message;
    const mensaje = Array.isArray(m) ? m[0] : typeof m === "string" ? m : null;
    return { ok: false, mensaje: mensaje ? String(mensaje) : MSG_ERROR_EXPORTAR };
  }
  return { ok: false, mensaje: MSG_ERROR_EXPORTAR };
}

/** Descarga un Blob con el nombre indicado. */
export function descargar(archivo: Blob, nombre: string) {
  const url = URL.createObjectURL(archivo);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Se libera después de que el navegador tome el enlace.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
