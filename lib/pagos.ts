import "server-only";
import { apiFetch } from "@/lib/api";
import type { Comprobante, CuotasPorPagar, PagoAprobado, Tarjeta } from "@/lib/types/pagos";

export type PagosResultado<T> =
  | { status: "ok"; data: T }
  | { status: "rechazado"; motivo: string }
  | { status: "bad_request"; messages: string[] }
  | { status: "forbidden" }
  | { status: "not_found" }
  | { status: "conflict"; message: string }
  | { status: "error" };

const mensajes = (body: unknown) => {
  const m = (body as { message?: unknown } | null)?.message;
  return Array.isArray(m) ? m.map(String) : typeof m === "string" ? [m] : [];
};

// Traduce la respuesta HTTP (mismo contrato que lib/visitas, más el 422 del
// rechazo). Nunca lanza por fallos de red o JSON inesperado; el redirect() de
// apiFetch (401) sí se propaga.
async function llamar<T>(
  path: string,
  init: RequestInit | undefined,
  extraer: (body: unknown) => T | null,
): Promise<PagosResultado<T>> {
  let res: Response;
  try {
    res = await apiFetch(path, init);
  } catch (e) {
    if (e instanceof Error && !("digest" in e)) return { status: "error" };
    throw e;
  }

  const body = await res.json().catch(() => null);
  if (res.status === 403) return { status: "forbidden" };
  if (res.status === 404) return { status: "not_found" };
  if (res.status === 409) {
    return { status: "conflict", message: mensajes(body)[0] ?? "Esta cuota ya fue pagada" };
  }
  if (res.status === 422) {
    const motivo = (body as { motivo?: unknown } | null)?.motivo;
    return { status: "rechazado", motivo: typeof motivo === "string" ? motivo : "Pago rechazado" };
  }
  if (res.status === 400) {
    const m = mensajes(body);
    return { status: "bad_request", messages: m.length > 0 ? m : ["Los datos no son válidos"] };
  }
  if (!res.ok) return { status: "error" };

  const data = extraer(body);
  return data === null ? { status: "error" } : { status: "ok", data };
}

export const getCuotasPorPagar = (unidadId?: string) =>
  llamar<CuotasPorPagar>(
    unidadId ? `pagos/pendientes?unidadId=${encodeURIComponent(unidadId)}` : "pagos/pendientes",
    undefined,
    (b) => {
      const d = b as CuotasPorPagar | null;
      return d && Array.isArray(d.cuotas) && Array.isArray(d.unidades) ? d : null;
    },
  );

// La Idempotency-Key la genera el formulario al abrirse: el doble clic no cobra dos veces.
export const pagarCuotas = (cuotaIds: string[], tarjeta: Tarjeta, clave: string) =>
  llamar<PagoAprobado>(
    "pagos",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": clave },
      body: JSON.stringify({ cuotaIds, tarjeta }),
    },
    (b) => {
      const d = b as PagoAprobado | null;
      return d && typeof d.numeroTransaccion === "string" ? d : null;
    },
  );

export const getComprobante = (numero: string) =>
  llamar<Comprobante>(`pagos/${encodeURIComponent(numero)}`, undefined, (b) => {
    const d = b as Comprobante | null;
    return d && typeof d.numeroTransaccion === "string" && Array.isArray(d.cuotas) ? d : null;
  });
