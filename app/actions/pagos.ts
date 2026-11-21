"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hoyEnElSalvador } from "@/lib/format";
import { pagarCuotas } from "@/lib/pagos";
import {
  erroresDesdeApi,
  tarjetaParaApi,
  validarPago,
  type CamposTarjeta,
  type ErroresPago,
} from "@/lib/validaciones/pago";

export type PagarState = {
  status: "idle" | "error" | "rechazado";
  errores?: ErroresPago;
  mensaje?: string;
  // Clave del intento rechazado: el formulario genera otra para reintentar.
  claveRechazada?: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIN_PERMISO = "No tienes permiso para esta acción";
const texto = (f: FormData, k: string) => String(f.get(k) ?? "");

export async function pagarAction(
  _prev: PagarState,
  formData: FormData,
): Promise<PagarState> {
  const cuotaIds = formData.getAll("cuotaIds").map(String);
  const clave = texto(formData, "clave");
  const tarjeta: CamposTarjeta = {
    numero: texto(formData, "numero"),
    vencimiento: texto(formData, "vencimiento"),
    cvv: texto(formData, "cvv"),
    titular: texto(formData, "titular"),
  };

  // Nunca se confía en el cliente: se valida de nuevo antes de llamar a la API.
  const errores = validarPago(cuotaIds, tarjeta, hoyEnElSalvador().slice(0, 7));
  if (Object.keys(errores).length > 0) return { status: "error", errores };
  if (!UUID.test(clave)) {
    return { status: "error", mensaje: "No pudimos procesar el pago. Intenta de nuevo." };
  }

  const r = await pagarCuotas(cuotaIds, tarjetaParaApi(tarjeta), clave);

  switch (r.status) {
    case "ok":
      revalidatePath("/estado-cuenta");
      // redirect() lanza: va fuera de cualquier try/catch.
      redirect(`/pagos/${encodeURIComponent(r.data.numeroTransaccion)}`);
    case "rechazado":
      return {
        status: "rechazado",
        mensaje: `Pago rechazado: ${r.motivo.toLowerCase()}`,
        claveRechazada: clave,
      };
    case "conflict":
      revalidatePath("/pagos/nuevo");
      return { status: "error", mensaje: r.message };
    case "bad_request": {
      const api = erroresDesdeApi(r.messages);
      return {
        status: "error",
        errores: api.errores,
        ...(api.resto.length > 0 ? { mensaje: api.resto.join(". ") } : {}),
      };
    }
    case "forbidden":
    case "not_found":
      return { status: "error", mensaje: SIN_PERMISO };
    default:
      return {
        status: "error",
        mensaje: "No pudimos procesar el pago. Intenta de nuevo.",
      };
  }
}
