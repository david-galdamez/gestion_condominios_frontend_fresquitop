"use server";

import { revalidatePath } from "next/cache";
import { marcarComoLeida, marcarTodasComoLeidas } from "@/lib/notificaciones";

export type MarcarResultado = { ok: true } | { ok: false; error: string };

// El layout muestra el contador de la campana, así que se revalida completo.
function refrescar() {
  revalidatePath("/notificaciones");
  revalidatePath("/", "layout");
}

export async function marcarNotificacionLeida(id: string): Promise<MarcarResultado> {
  try {
    await marcarComoLeida(id);
  } catch (e) {
    // El redirect() de apiFetch (401) lleva `digest` y debe propagarse.
    if (e instanceof Error && "digest" in e) throw e;
    return { ok: false, error: "No pudimos marcar la notificación como leída." };
  }
  refrescar();
  return { ok: true };
}

export async function marcarTodasNotificacionesLeidas(): Promise<MarcarResultado> {
  try {
    await marcarTodasComoLeidas();
  } catch (e) {
    if (e instanceof Error && "digest" in e) throw e;
    return { ok: false, error: "No pudimos marcar las notificaciones como leídas." };
  }
  refrescar();
  return { ok: true };
}
