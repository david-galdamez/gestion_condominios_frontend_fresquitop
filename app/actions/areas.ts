"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actualizarArea, cambiarEstadoArea, crearArea } from "@/lib/areas";
import {
  aDatosArea,
  erroresDesdeApi,
  MSG,
  validarArea,
  type CamposArea,
  type ErroresArea,
} from "@/lib/validaciones/area";

export type GuardarAreaState = {
  status: "idle" | "error";
  errores?: ErroresArea;
  // Errores de la API (o genéricos) que se muestran arriba del formulario.
  mensajes?: string[];
};

const RUTA_LISTA = "/admin/areas";
const SIN_PERMISO = "No tienes permiso para esta acción";
const texto = (f: FormData, k: string) => String(f.get(k) ?? "");

// Crea (sin id) o edita (con id). Si sale bien vuelve a la lista con un aviso.
export async function guardarArea(
  _prev: GuardarAreaState,
  formData: FormData,
): Promise<GuardarAreaState> {
  const id = texto(formData, "id");
  const campos: CamposArea = {
    nombre: texto(formData, "nombre"),
    capacidad: texto(formData, "capacidad"),
    horaApertura: texto(formData, "horaApertura"),
    horaCierre: texto(formData, "horaCierre"),
    duracionMaxHoras: texto(formData, "duracionMaxHoras"),
  };

  // Nunca se confía en el cliente: se valida de nuevo antes de llamar a la API.
  const errores = validarArea(campos);
  if (Object.keys(errores).length > 0) return { status: "error", errores };

  const datos = aDatosArea(campos);
  const r = id ? await actualizarArea(id, datos) : await crearArea(datos);

  switch (r.status) {
    case "ok":
      revalidatePath(RUTA_LISTA);
      // redirect() lanza: va fuera de cualquier try/catch.
      redirect(`${RUTA_LISTA}?ok=${id ? "editada" : "creada"}`);
    case "conflict":
      return { status: "error", errores: { nombre: MSG.duplicado } };
    case "bad_request": {
      const api = erroresDesdeApi(r.messages);
      return {
        status: "error",
        errores: api.errores,
        ...(api.resto.length > 0 ? { mensajes: api.resto } : {}),
      };
    }
    case "not_found":
      return { status: "error", mensajes: ["El área no existe"] };
    case "forbidden":
      return { status: "error", mensajes: [SIN_PERMISO] };
    default:
      return {
        status: "error",
        mensajes: ["No pudimos guardar el área. Intenta de nuevo."],
      };
  }
}

export type CambiarEstadoResultado =
  | { ok: true }
  | { ok: false; error: string };

export async function actualizarEstadoArea(
  id: string,
  activa: boolean,
): Promise<CambiarEstadoResultado> {
  const r = await cambiarEstadoArea(id, activa);
  switch (r.status) {
    case "ok":
      revalidatePath(RUTA_LISTA);
      return { ok: true };
    case "not_found":
      revalidatePath(RUTA_LISTA);
      return { ok: false, error: "El área no existe" };
    case "forbidden":
      return { ok: false, error: SIN_PERMISO };
    default:
      return {
        ok: false,
        error: "No pudimos cambiar el estado del área. Intenta de nuevo.",
      };
  }
}
