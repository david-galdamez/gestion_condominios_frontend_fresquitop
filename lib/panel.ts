import "server-only";
import { apiFetch } from "@/lib/api";
import { queryDePeriodo } from "@/lib/panel-periodo";
import type { PanelPeriodo, PanelRespuesta } from "@/lib/types/panel";

export type PanelResultado =
  | { status: "ok"; data: PanelRespuesta }
  | { status: "forbidden" }
  | { status: "bad_request"; message: string }
  | { status: "error" };

function esRespuestaValida(x: unknown): x is PanelRespuesta {
  const r = x as PanelRespuesta | null;
  return (
    !!r &&
    typeof r.mora?.monto === "number" &&
    typeof r.mora?.porcentajeMorosas === "number" &&
    Array.isArray(r.ocupacion) &&
    typeof r.incidencias?.SIN_ASIGNAR === "number" &&
    Array.isArray(r.participacion)
  );
}

// Consulta el panel en GET /api/v1/admin/panel?desde=&hasta=.
// Traduce errores de red o de servidor al status "error".
export async function getPanel(
  periodo: Pick<PanelPeriodo, "desde" | "hasta">,
): Promise<PanelResultado> {
  let res: Response;
  try {
    res = await apiFetch(`admin/panel?${queryDePeriodo(periodo)}`);
  } catch (e) {
    // Propaga el redirect() lanzado por apiFetch ante un 401.
    if (e instanceof Error && !("digest" in e)) return { status: "error" };
    throw e;
  }

  if (res.status === 403) return { status: "forbidden" };

  if (res.status === 400) {
    const body = await res.json().catch(() => null);
    const m = body?.message;
    const message = Array.isArray(m)
      ? m.join(". ")
      : typeof m === "string"
        ? m
        : "El periodo no es válido.";
    return { status: "bad_request", message };
  }

  if (!res.ok) return { status: "error" };

  const body = await res.json().catch(() => null);
  if (!esRespuestaValida(body)) return { status: "error" };
  return { status: "ok", data: body };
}
