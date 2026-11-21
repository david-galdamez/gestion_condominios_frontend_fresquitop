"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearUsuario } from "@/lib/usuarios";
import {
  aDatosUsuario,
  erroresDesdeApi,
  MSG,
  validarUsuario,
  type CamposUsuario,
  type ErroresUsuario,
} from "@/lib/validaciones/usuario";

export type CrearUsuarioState = {
  status: "idle" | "error";
  errores?: ErroresUsuario;
  // Errores de la API (o genéricos) que se muestran arriba del formulario.
  mensajes?: string[];
};

const RUTA = "/admin/usuarios/nuevo";

// Alta de residente (solo administrador). Si sale bien vuelve al formulario
// vacío con un aviso, listo para registrar al siguiente.
export async function crearResidente(
  _prev: CrearUsuarioState,
  formData: FormData,
): Promise<CrearUsuarioState> {
  const campos: CamposUsuario = {
    nombre: String(formData.get("nombre") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    unidadIds: formData.getAll("unidadIds").map(String),
  };

  // Nunca se confía en el cliente: se valida de nuevo antes de llamar a la API.
  const errores = validarUsuario(campos);
  if (Object.keys(errores).length > 0) return { status: "error", errores };

  const r = await crearUsuario(aDatosUsuario(campos));

  switch (r.status) {
    case "ok":
      revalidatePath(RUTA);
      // redirect() lanza: va fuera de cualquier try/catch.
      redirect(`${RUTA}?ok=creado`);
    case "conflict":
      return { status: "error", errores: { email: MSG.duplicado } };
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
        mensajes: ["No pudimos crear el residente. Intenta de nuevo."],
      };
  }
}
