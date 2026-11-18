"use server";

import { revalidatePath } from "next/cache";
import { guardarMiPerfil } from "@/lib/perfil-directorio";
import type { PerfilDirectorio } from "@/lib/types/perfil-directorio";
import {
  opcionesDesdeFormData,
  validarPerfil,
} from "@/lib/validaciones/perfil-directorio";

export type GuardarPerfilState = {
  status: "idle" | "ok" | "error";
  error?: string;
  perfil?: PerfilDirectorio;
};

const ERROR_GENERAL = "No pudimos guardar. Intenta de nuevo.";

export async function guardarPerfilDirectorio(
  _prev: GuardarPerfilState,
  formData: FormData,
): Promise<GuardarPerfilState> {
  const opciones = opcionesDesdeFormData(formData);
  if (!opciones) return { status: "error", error: ERROR_GENERAL };

  // Nunca se confía en el cliente: se valida de nuevo antes de llamar a la API.
  const error = validarPerfil(opciones);
  if (error) return { status: "error", error };

  const r = await guardarMiPerfil(opciones);
  switch (r.status) {
    case "ok":
      revalidatePath("/directorio/mi-perfil");
      return { status: "ok", perfil: r.data };
    case "bad_request":
      return { status: "error", error: r.messages[0] ?? ERROR_GENERAL };
    case "forbidden":
      return { status: "error", error: "No tienes permiso para esta acción" };
    default:
      return { status: "error", error: ERROR_GENERAL };
  }
}
