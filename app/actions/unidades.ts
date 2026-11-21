"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearUnidad } from "@/lib/usuarios";
import {
  erroresDesdeApi,
  MSG,
  validarUnidad,
  type ErroresUnidad,
} from "@/lib/validaciones/unidad";

export type CrearUnidadState = {
  status: "idle" | "error";
  errores?: ErroresUnidad;
  mensajes?: string[];
};

const RUTA = "/admin/unidades/nueva";

// Alta de unidad (solo administrador). Vuelve al formulario con un aviso.
export async function crearNuevaUnidad(
  _prev: CrearUnidadState,
  formData: FormData,
): Promise<CrearUnidadState> {
  const campos = {
    torreId: String(formData.get("torreId") ?? ""),
    codigo: String(formData.get("codigo") ?? ""),
  };

  const errores = validarUnidad(campos);
  if (Object.keys(errores).length > 0) return { status: "error", errores };

  const r = await crearUnidad({
    torreId: campos.torreId,
    codigo: campos.codigo.trim(),
  });

  switch (r.status) {
    case "ok":
      revalidatePath(RUTA);
      revalidatePath("/admin/usuarios/nuevo");
      // redirect() lanza: va fuera de cualquier try/catch.
      redirect(`${RUTA}?ok=creada`);
    case "conflict":
      return { status: "error", errores: { codigo: MSG.duplicado } };
    case "bad_request": {
      const api = erroresDesdeApi(r.messages);
      return {
        status: "error",
        errores: api.errores,
        ...(api.resto.length > 0 ? { mensajes: api.resto } : {}),
      };
    }
    case "forbidden":
      return { status: "error", mensajes: ["No tienes permiso para esta acción"] };
    default:
      return {
        status: "error",
        mensajes: ["No pudimos crear la unidad. Intenta de nuevo."],
      };
  }
}
