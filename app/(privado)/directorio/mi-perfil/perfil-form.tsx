"use client";

import { startTransition, useActionState, useState } from "react";
import {
  guardarPerfilDirectorio,
  type GuardarPerfilState,
} from "@/app/actions/perfil-directorio";
import type { OpcionesPerfil, PerfilDirectorio } from "@/lib/types/perfil-directorio";
import {
  DATOS,
  normalizarTelefono,
  validarPerfil,
  vistaPrevia,
} from "@/lib/validaciones/perfil-directorio";
import { VistaPrevia } from "./vista-previa";

const btnPrimario =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60";

const inicial: GuardarPerfilState = { status: "idle" };

export function PerfilForm({ perfil }: { perfil: PerfilDirectorio }) {
  const [state, formAction, pending] = useActionState(guardarPerfilDirectorio, inicial);
  const [opciones, setOpciones] = useState<OpcionesPerfil>({
    visible: perfil.visible,
    mostrarNombre: perfil.mostrarNombre,
    mostrarUnidad: perfil.mostrarUnidad,
    mostrarTelefono: perfil.mostrarTelefono,
    mostrarCorreo: perfil.mostrarCorreo,
  });
  // Hotfix 1.0.1: el residente registra aquí su teléfono.
  const [telefono, setTelefono] = useState(perfil.misDatos.telefono ?? "");
  // El aviso "Preferencias guardadas" se oculta en cuanto el usuario cambia algo.
  const [tocado, setTocado] = useState(false);

  const errorCliente = validarPerfil(opciones, telefono);
  // Datos propios con el teléfono que se está escribiendo (si ya es válido).
  const telefonoValido = errorCliente ? perfil.misDatos.telefono : normalizarTelefono(telefono);
  const misDatos = { ...perfil.misDatos, telefono: telefonoValido };
  const error = errorCliente ?? (state.status === "error" && !tocado ? state.error : undefined);

  function cambiar(k: keyof OpcionesPerfil, v: boolean) {
    setOpciones((o) => ({ ...o, [k]: v }));
    setTocado(true);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (errorCliente) return;
    // Las casillas deshabilitadas no viajan en un <form>: se arma el FormData a mano.
    const fd = new FormData();
    for (const [k, v] of Object.entries(opciones)) fd.set(k, String(v));
    fd.set("telefono", telefono);
    setTocado(false);
    startTransition(() => formAction(fd));
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex flex-1 flex-col gap-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"
      >
        <label className="flex items-center gap-3 font-medium">
          <input
            type="checkbox"
            role="switch"
            checked={opciones.visible}
            aria-checked={opciones.visible}
            onChange={(e) => cambiar("visible", e.target.checked)}
            className="h-5 w-5"
          />
          Aparecer en el directorio
        </label>

        <div className="flex flex-col gap-1">
          <label htmlFor="telefono" className="text-sm font-medium">
            Teléfono
          </label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={9}
            placeholder="7044-2727"
            value={telefono}
            onChange={(e) => {
              setTelefono(e.target.value);
              setTocado(true);
            }}
            aria-describedby="telefono-ayuda"
            className="w-full max-w-48 rounded-md border border-zinc-300 bg-transparent px-3 py-1.5 text-sm dark:border-zinc-700"
          />
          <p id="telefono-ayuda" className="text-xs text-zinc-500">
            Opcional. 8 dígitos, con o sin guion. Déjalo vacío para borrarlo.
          </p>
        </div>

        <fieldset
          disabled={!opciones.visible}
          aria-describedby={error ? "perfil-error" : undefined}
          className="flex flex-col gap-2 disabled:opacity-60"
        >
          <legend className="mb-1 text-sm font-medium">Datos que quiero mostrar</legend>
          {DATOS.map(({ campo, opcion, etiqueta }) => {
            const valor = misDatos[campo];
            return (
              <label key={opcion} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={opciones[opcion]}
                  onChange={(e) => cambiar(opcion, e.target.checked)}
                />
                <span>{etiqueta}</span>
                <span className="text-zinc-500">· {valor ?? "no registrado"}</span>
              </label>
            );
          })}
          {!opciones.visible && (
            <p className="text-xs text-zinc-500">
              Activa “Aparecer en el directorio” para elegir qué datos mostrar.
            </p>
          )}
        </fieldset>

        {error && (
          <p id="perfil-error" role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        {state.status === "ok" && !tocado && (
          <p role="status" className="text-sm text-green-700 dark:text-green-400">
            Preferencias guardadas
          </p>
        )}

        <div>
          <button
            type="submit"
            disabled={pending || Boolean(errorCliente)}
            className={btnPrimario}
          >
            {pending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>

      <VistaPrevia
        vista={vistaPrevia(opciones, misDatos)}
        marcados={opciones}
      />
    </div>
  );
}
