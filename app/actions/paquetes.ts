"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { entregarPaquete, registrarPaquete } from "@/lib/paquetes";
import {
  erroresDesdeApi,
  erroresEntregaDesdeApi,
  MSG,
  MSG_ENTREGA,
  validarEntrega,
  validarPaquete,
  type CamposPaquete,
  type ErroresEntrega,
  type ErroresPaquete,
} from "@/lib/validaciones/paquete";

export type RegistrarPaqueteState = {
  status: "idle" | "error";
  errores?: ErroresPaquete;
  // Errores de la API (o genéricos) que se muestran arriba del formulario.
  mensajes?: string[];
};

const RUTA_LISTA = "/porteria/paquetes";
const texto = (f: FormData, k: string) => String(f.get(k) ?? "");

export async function registrarPaqueteAction(
  _prev: RegistrarPaqueteState,
  formData: FormData,
): Promise<RegistrarPaqueteState> {
  const campos: CamposPaquete = {
    unidadId: texto(formData, "unidadId"),
    destinatario: texto(formData, "destinatario").trim(),
    mensajeria: texto(formData, "mensajeria"),
    guia: texto(formData, "guia").trim(),
  };
  const foto = formData.get("foto");
  const archivo = foto instanceof File ? foto : null;

  // Nunca se confía en el cliente: se valida de nuevo antes de llamar a la API.
  const errores = validarPaquete(campos, archivo);
  if (Object.keys(errores).length > 0 || !archivo) {
    return { status: "error", errores };
  }

  const envio = new FormData();
  envio.set("unidadId", campos.unidadId);
  envio.set("destinatario", campos.destinatario);
  envio.set("mensajeria", campos.mensajeria);
  if (campos.guia) envio.set("guia", campos.guia);
  envio.set("foto", archivo, archivo.name || "foto");

  const r = await registrarPaquete(envio);

  switch (r.status) {
    case "ok": {
      revalidatePath(RUTA_LISTA);
      const q = new URLSearchParams({
        registrado: r.data.codigoPaquete,
        unidad: r.data.unidad,
      });
      // redirect() lanza: va fuera de cualquier try/catch.
      redirect(`${RUTA_LISTA}?${q}`);
    }
    case "conflict":
      return { status: "error", errores: { unidadId: MSG.sinResidentes } };
    case "not_found":
      return { status: "error", errores: { unidadId: MSG.unidadNoExiste } };
    case "bad_request": {
      const api = erroresDesdeApi(r.messages);
      return {
        status: "error",
        errores: api.errores,
        ...(api.resto.length > 0 ? { mensajes: api.resto } : {}),
      };
    }
    case "forbidden":
      return {
        status: "error",
        mensajes: ["No tienes permiso para esta acción"],
      };
    default:
      return {
        status: "error",
        mensajes: ["No pudimos registrar el paquete. Intenta de nuevo."],
      };
  }
}

export type EntregarPaqueteState = {
  status: "idle" | "error";
  errores?: ErroresEntrega;
  // Errores de la API (o genéricos) que se muestran arriba del diálogo.
  mensajes?: string[];
};

// H10. Se usa con .bind(null, id) desde el diálogo de entrega.
export async function entregarPaqueteAction(
  id: string,
  _prev: EntregarPaqueteState,
  formData: FormData,
): Promise<EntregarPaqueteState> {
  const campos = {
    codigoRetiro: texto(formData, "codigoRetiro").trim(),
    recibidoPor: texto(formData, "recibidoPor").trim(),
  };

  // Nunca se confía en el cliente: se valida de nuevo antes de llamar a la API.
  const errores = validarEntrega(campos);
  if (Object.keys(errores).length > 0) return { status: "error", errores };

  const r = await entregarPaquete(id, campos);

  switch (r.status) {
    case "ok": {
      revalidatePath(RUTA_LISTA);
      // redirect() lanza: va fuera de cualquier try/catch.
      redirect(`${RUTA_LISTA}?${new URLSearchParams({ entregado: r.data.codigoPaquete })}`);
    }
    case "bad_request": {
      const api = erroresEntregaDesdeApi(r.messages);
      return {
        status: "error",
        errores: api.errores,
        ...(api.resto.length > 0 ? { mensajes: api.resto } : {}),
      };
    }
    case "conflict":
      // La lista quedó desactualizada: se refresca igual.
      revalidatePath(RUTA_LISTA);
      return { status: "error", mensajes: [MSG_ENTREGA.yaEntregado] };
    case "not_found":
      revalidatePath(RUTA_LISTA);
      return { status: "error", mensajes: ["El paquete no existe"] };
    case "forbidden":
      return {
        status: "error",
        mensajes: ["No tienes permiso para esta acción"],
      };
    default:
      return {
        status: "error",
        mensajes: ["No pudimos registrar la entrega. Intenta de nuevo."],
      };
  }
}
