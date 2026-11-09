"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useState } from "react";
import {
  registrarPaqueteAction,
  type RegistrarPaqueteState,
} from "@/app/actions/paquetes";
import type { UnidadResumen } from "@/lib/types/paquetes";
import {
  MENSAJERIAS,
  validarDestinatario,
  validarFoto,
  validarGuia,
  validarPaquete,
  validarUnidad,
  type CamposPaquete,
  type ErroresPaquete,
} from "@/lib/validaciones/paquete";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100";
const btnPrimario =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60";

const inicial: RegistrarPaqueteState = { status: "idle" };

type CampoConError = keyof ErroresPaquete;

export function PaqueteForm({ unidades }: { unidades: UnidadResumen[] }) {
  const [state, formAction, pending] = useActionState(
    registrarPaqueteAction,
    inicial,
  );
  const [campos, setCampos] = useState<CamposPaquete>({
    unidadId: "",
    destinatario: "",
    mensajeria: "",
    guia: "",
  });
  // La foto vive en el estado (no en el input) para no perderla si el
  // servidor responde con error: un <input type="file"> no se puede rellenar.
  const [foto, setFoto] = useState<{ archivo: File; vista: string | null } | null>(null);
  const [errCliente, setErrCliente] = useState<ErroresPaquete>({});

  // Libera la URL de la vista previa al cambiar de foto o al salir.
  useEffect(() => {
    const vista = foto?.vista;
    return () => {
      if (vista) URL.revokeObjectURL(vista);
    };
  }, [foto]);

  // Los errores del cliente (más recientes) tienen prioridad sobre los del servidor.
  const errores: ErroresPaquete = { ...state.errores, ...errCliente };

  function set<K extends keyof CamposPaquete>(k: K, v: CamposPaquete[K]) {
    setCampos((c) => ({ ...c, [k]: v }));
    setErrCliente((e) => ({ ...e, [k]: undefined }));
  }

  function blur(k: CampoConError, error: string | undefined) {
    setErrCliente((e) => ({ ...e, [k]: error }));
  }

  function elegirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0] ?? null;
    const error = validarFoto(archivo);
    setErrCliente((x) => ({ ...x, foto: archivo ? error : undefined }));
    setFoto(
      archivo && !error
        ? {
            archivo,
            vista:
              typeof URL.createObjectURL === "function"
                ? URL.createObjectURL(archivo)
                : null,
          }
        : null,
    );
    // Un archivo rechazado no queda seleccionado.
    if (error) e.target.value = "";
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validarPaquete(campos, foto?.archivo);
    setErrCliente(errs);
    if (Object.keys(errs).length > 0 || !foto) return;

    const fd = new FormData();
    fd.set("unidadId", campos.unidadId);
    fd.set("destinatario", campos.destinatario);
    fd.set("mensajeria", campos.mensajeria);
    fd.set("guia", campos.guia);
    fd.set("foto", foto.archivo);
    startTransition(() => formAction(fd));
  }

  const campo = (
    k: CampoConError,
    label: string,
    control: React.ReactNode,
  ) => (
    <div className="flex flex-col gap-1">
      <label htmlFor={k} className="text-sm font-medium">
        {label}
      </label>
      {control}
      {errores[k] && (
        <p id={`${k}-error`} className="text-sm text-red-600">
          {errores[k]}
        </p>
      )}
    </div>
  );

  const ariaDe = (k: CampoConError) => ({
    "aria-invalid": errores[k] ? true : undefined,
    "aria-describedby": errores[k] ? `${k}-error` : undefined,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-xl flex-col gap-4">
      {state.mensajes && state.mensajes.length > 0 && (
        <div role="alert" className="text-sm text-red-600">
          {state.mensajes.map((m) => (
            <p key={m}>{m}</p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {campo(
          "unidadId",
          "Unidad",
          <select
            id="unidadId"
            value={campos.unidadId}
            onChange={(e) => set("unidadId", e.target.value)}
            onBlur={() => blur("unidadId", validarUnidad(campos.unidadId))}
            className={inputClass}
            {...ariaDe("unidadId")}
          >
            <option value="">Selecciona una unidad</option>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.codigo}
              </option>
            ))}
          </select>,
        )}

        {campo(
          "mensajeria",
          "Mensajería",
          <select
            id="mensajeria"
            value={campos.mensajeria}
            onChange={(e) => set("mensajeria", e.target.value)}
            className={inputClass}
            {...ariaDe("mensajeria")}
          >
            <option value="">Elige una mensajería</option>
            {MENSAJERIAS.map((m) => (
              <option key={m.valor} value={m.valor}>
                {m.etiqueta}
              </option>
            ))}
          </select>,
        )}
      </div>

      {campo(
        "destinatario",
        "Destinatario (nombre de la etiqueta)",
        <input
          id="destinatario"
          type="text"
          autoComplete="off"
          maxLength={60}
          value={campos.destinatario}
          onChange={(e) => set("destinatario", e.target.value)}
          onBlur={() => blur("destinatario", validarDestinatario(campos.destinatario))}
          className={inputClass}
          {...ariaDe("destinatario")}
        />,
      )}

      {campo(
        "guia",
        "Número de guía (opcional)",
        <input
          id="guia"
          type="text"
          autoComplete="off"
          value={campos.guia}
          onChange={(e) => set("guia", e.target.value)}
          onBlur={() => blur("guia", validarGuia(campos.guia))}
          className={inputClass}
          {...ariaDe("guia")}
        />,
      )}

      {campo(
        "foto",
        "Foto del paquete (JPG o PNG, hasta 5 MB)",
        <div className="flex flex-col gap-2">
          <input
            id="foto"
            type="file"
            accept="image/jpeg,image/png"
            onChange={elegirFoto}
            className="text-sm file:mr-3 file:rounded-md file:border file:border-zinc-300 file:bg-transparent file:px-3 file:py-1.5 file:text-sm dark:file:border-zinc-700"
            {...ariaDe("foto")}
          />
          {foto && (
            <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
              {foto.vista && (
                // eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:)
                <img
                  src={foto.vista}
                  alt="Vista previa de la foto"
                  className="h-16 w-16 rounded-md border border-zinc-200 object-cover dark:border-zinc-800"
                />
              )}
              <span>{foto.archivo.name}</span>
            </div>
          )}
        </div>,
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={btnPrimario}>
          {pending ? "Registrando..." : "Registrar"}
        </button>
        <Link
          href="/porteria/paquetes"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
