"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  crearResidente,
  type CrearUsuarioState,
} from "@/app/actions/usuarios";
import { SelectorUnidades } from "./selector-unidades";
import type { UnidadActiva } from "@/lib/types/usuarios";
import {
  validarEmail,
  validarNombre,
  validarPassword,
  validarUsuario,
  type CamposUsuario,
  type ErroresUsuario,
} from "@/lib/validaciones/usuario";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100";
const btnPrimario =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60";

const inicial: CrearUsuarioState = { status: "idle" };

export function UsuarioForm({ unidades }: { unidades: UnidadActiva[] }) {
  const [state, formAction, pending] = useActionState(crearResidente, inicial);
  // Controlados: React 19 reinicia los campos tras una acción y se perdería
  // lo escrito si el servidor devuelve un error.
  const [campos, setCampos] = useState<CamposUsuario>({
    nombre: "",
    email: "",
    password: "",
    unidadIds: [],
  });
  const [errCliente, setErrCliente] = useState<ErroresUsuario>({});
  const errores: ErroresUsuario = { ...state.errores, ...errCliente };

  function set<K extends keyof CamposUsuario>(k: K, v: CamposUsuario[K]) {
    setCampos((c) => ({ ...c, [k]: v }));
    setErrCliente((e) => ({ ...e, [k]: undefined }));
  }
  const blur = (k: keyof CamposUsuario, error: string | undefined) =>
    setErrCliente((e) => ({ ...e, [k]: error }));

  function alternarUnidad(id: string) {
    set(
      "unidadIds",
      campos.unidadIds.includes(id)
        ? campos.unidadIds.filter((u) => u !== id)
        : [...campos.unidadIds, id],
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const errs = validarUsuario(campos);
    setErrCliente(errs);
    if (Object.keys(errs).length > 0) e.preventDefault();
  }

  const ariaDe = (k: keyof CamposUsuario) => ({
    "aria-invalid": errores[k] ? true : undefined,
    "aria-describedby": errores[k] ? `${k}-error` : undefined,
  });

  const campo = (
    k: keyof CamposUsuario,
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

  return (
    <form
      action={formAction}
      onSubmit={onSubmit}
      noValidate
      className="flex max-w-xl flex-col gap-4"
    >
      {state.mensajes && state.mensajes.length > 0 && (
        <div role="alert" className="text-sm text-red-600">
          {state.mensajes.map((m) => (
            <p key={m}>{m}</p>
          ))}
        </div>
      )}

      {campo(
        "nombre",
        "Nombre completo",
        <input
          id="nombre"
          name="nombre"
          type="text"
          autoComplete="off"
          maxLength={120}
          value={campos.nombre}
          onChange={(e) => set("nombre", e.target.value)}
          onBlur={() => blur("nombre", validarNombre(campos.nombre))}
          className={inputClass}
          {...ariaDe("nombre")}
        />,
      )}

      {campo(
        "email",
        "Correo electrónico",
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="off"
          maxLength={254}
          value={campos.email}
          onChange={(e) => set("email", e.target.value)}
          onBlur={() => blur("email", validarEmail(campos.email))}
          className={inputClass}
          {...ariaDe("email")}
        />,
      )}

      {campo(
        "password",
        "Contraseña inicial",
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          maxLength={72}
          value={campos.password}
          onChange={(e) => set("password", e.target.value)}
          onBlur={() => blur("password", validarPassword(campos.password))}
          className={inputClass}
          {...ariaDe("password")}
        />,
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="unidades" className="text-sm font-medium">
          Unidades
        </label>
        {unidades.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No hay unidades activas registradas.{" "}
            <Link href="/admin/unidades/nueva" className="underline">
              Registra una unidad
            </Link>
          </p>
        ) : (
          <SelectorUnidades
            unidades={unidades}
            seleccion={campos.unidadIds}
            onAlternar={alternarUnidad}
          />
        )}
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Sin unidad, el residente no podrá ver su estado de cuenta, paquetes ni
          hacer reservas.
        </p>
      </div>

      <div>
        <button type="submit" disabled={pending} className={btnPrimario}>
          {pending ? "Guardando..." : "Registrar residente"}
        </button>
      </div>
    </form>
  );
}
