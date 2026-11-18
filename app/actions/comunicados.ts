"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearComunicado } from "@/lib/comunicados";
import type { CategoriaComunicado } from "@/lib/types/comunicados";
import {
  aIsoSv,
  aLocalSv,
  erroresDesdeApi,
  validarComunicado,
  type CamposComunicado,
  type ErroresComunicado,
} from "@/lib/validaciones/comunicado";

export type PublicarComunicadoState = {
  status: "idle" | "error";
  errores?: ErroresComunicado;
  mensajes?: string[];
};

const RUTA_LISTA = "/admin/comunicados";
const texto = (f: FormData, k: string) => String(f.get(k) ?? "");

export async function publicarComunicado(
  _prev: PublicarComunicadoState,
  formData: FormData,
): Promise<PublicarComunicadoState> {
  const campos: CamposComunicado = {
    titulo: texto(formData, "titulo").trim(),
    contenido: texto(formData, "contenido").trim(),
    categoria: texto(formData, "categoria"),
    destino: texto(formData, "destino"),
    torreIds: formData.getAll("torreIds").map(String),
    fechaPublicacion: texto(formData, "fechaPublicacion"),
    fechaExpiracion: texto(formData, "fechaExpiracion"),
  };

  const errores = validarComunicado(campos);
  if (Object.keys(errores).length > 0) return { status: "error", errores };

  // Publicación vacía o ya pasada: se publica ahora (el backend hace lo mismo).
  const programado =
    campos.fechaPublicacion !== "" &&
    campos.fechaPublicacion > aLocalSv(new Date());

  const r = await crearComunicado({
    titulo: campos.titulo,
    contenido: campos.contenido,
    categoria: campos.categoria as CategoriaComunicado,
    destino:
      campos.destino === "todos"
        ? { todos: true }
        : { todos: false, torreIds: campos.torreIds },
    ...(programado
      ? { fechaPublicacion: aIsoSv(campos.fechaPublicacion) }
      : {}),
    ...(campos.fechaExpiracion
      ? { fechaExpiracion: aIsoSv(campos.fechaExpiracion) }
      : {}),
  });

  switch (r.status) {
    case "ok":
      revalidatePath(RUTA_LISTA);
      // redirect() lanza: va fuera de cualquier try/catch.
      redirect(`${RUTA_LISTA}?ok=${r.data.estado === "PROGRAMADO" ? "programado" : "publicado"}`);
    case "bad_request": {
      const api = erroresDesdeApi(r.messages);
      return {
        status: "error",
        errores: api.errores,
        ...(api.resto.length > 0 ? { mensajes: api.resto } : {}),
      };
    }
    case "not_found":
      return { status: "error", mensajes: ["La torre no existe"] };
    case "forbidden":
      return { status: "error", mensajes: ["No tienes permiso para esta acción"] };
    default:
      return {
        status: "error",
        mensajes: ["No pudimos guardar el comunicado. Intenta de nuevo."],
      };
  }
}
