import type { Metadata } from "next";
import Link from "next/link";
import { buscarAutorizacionesDeHoy, buscarDentro } from "@/lib/accesos";
import { requireRol } from "@/lib/auth";
import { hoyEnElSalvador } from "@/lib/format";
import {
  AVISOS,
  ERRORES,
  HORA,
  normalizarBusqueda,
  validarBusqueda,
  type ClaveError,
} from "@/lib/validaciones/acceso";
import { ListaAutorizaciones, ListaDentro } from "./resultados";

export const metadata: Metadata = { title: "Control de accesos" };

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100";
const btnPrimario =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background";
const aviso =
  "rounded-md border border-green-600/40 bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-200";

const texto = (v: string | string[] | undefined) =>
  typeof v === "string" ? v : "";

// FE-8.1: pantalla de portería (ruta /porteria/accesos, rol SEGURIDAD).
export default async function AccesosPage({
  searchParams,
}: PageProps<"/porteria/accesos">) {
  await requireRol("SEGURIDAD");
  const params = await searchParams;
  const q = normalizarBusqueda(texto(params.q));
  const hora = texto(params.hora);

  // Solo se muestran mensajes conocidos: la URL trae claves, no texto.
  const tipoAviso = texto(params.aviso);
  const mensajeAviso =
    (tipoAviso === "entrada" || tipoAviso === "salida") && HORA.test(hora)
      ? AVISOS[tipoAviso](hora)
      : undefined;
  const claveError = texto(params.error) as ClaveError;
  const mensajeError = Object.hasOwn(ERRORES, claveError)
    ? ERRORES[claveError]
    : undefined;

  const errorBusqueda = q ? validarBusqueda(q) : undefined;
  const buscar = q && !errorBusqueda;
  const [autorizaciones, dentro] = buscar
    ? await Promise.all([buscarAutorizacionesDeHoy(q), buscarDentro(q)])
    : [null, null];

  const sinPermiso =
    autorizaciones?.status === "forbidden" || dentro?.status === "forbidden";
  const falloCarga =
    !sinPermiso &&
    ((autorizaciones && autorizaciones.status !== "ok") ||
      (dentro && dentro.status !== "ok"));
  const listaAut = autorizaciones?.status === "ok" ? autorizaciones.data : [];
  const listaDentro = dentro?.status === "ok" ? dentro.data : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Control de accesos</h1>
        <Link href="/porteria/accesos/nuevo" className={btnPrimario}>
          Visitante sin pre-autorización
        </Link>
      </div>

      {mensajeAviso && (
        <p role="status" className={aviso}>
          {mensajeAviso}
        </p>
      )}
      {mensajeError && (
        <p role="alert" className="text-sm text-red-600">
          {mensajeError}
        </p>
      )}

      <form
        action="/porteria/accesos"
        method="get"
        role="search"
        className="flex max-w-xl flex-col gap-2 sm:flex-row sm:items-end"
      >
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="q" className="text-sm font-medium">
            Código de 6 dígitos o número de documento
          </label>
          <input
            id="q"
            name="q"
            type="search"
            autoComplete="off"
            maxLength={12}
            defaultValue={q}
            placeholder="048213 o 01234567-8"
            className={inputClass}
            aria-invalid={errorBusqueda ? true : undefined}
            aria-describedby={errorBusqueda ? "q-error" : undefined}
          />
        </div>
        <button type="submit" className={btnPrimario}>
          Buscar
        </button>
      </form>
      {errorBusqueda && (
        <p id="q-error" className="text-sm text-red-600">
          {errorBusqueda}
        </p>
      )}

      {sinPermiso && <p role="alert">{ERRORES.permiso}</p>}
      {falloCarga && (
        <p role="alert">No pudimos buscar. Intenta de nuevo.</p>
      )}

      {buscar && !sinPermiso && !falloCarga && (
        <div className="flex flex-col gap-6">
          {listaAut.length === 0 && listaDentro.length === 0 && (
            <p className="py-6 text-center text-zinc-600 dark:text-zinc-400">
              No hay autorizaciones con ese código o documento
            </p>
          )}
          {listaAut.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Autorizaciones de hoy</h2>
              <ListaAutorizaciones
                autorizaciones={listaAut}
                q={q}
                hoy={hoyEnElSalvador()}
              />
            </section>
          )}
          {listaDentro.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Visitantes dentro</h2>
              <ListaDentro accesos={listaDentro} q={q} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
