"use client";

import { useActionState, useState } from "react";
import {
  guardarConfiguracionAction,
  type GuardarConfiguracionState,
} from "@/app/actions/cuotas";
import { formatFecha, formatUsd } from "@/lib/format";
import type { ConfiguracionCuota } from "@/lib/types/cuotas";
import {
  validarConfiguracion,
  validarDia,
  validarMonto,
  type CamposConfiguracion,
  type ErroresConfiguracion,
} from "@/lib/validaciones/cuota";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100";
const btnPrimario =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60";

const inicial: GuardarConfiguracionState = { status: "idle" };

// FE-2.1: monto mensual y día de vencimiento con que se generan las cuotas.
export function ConfiguracionForm({
  configuracion,
}: {
  configuracion: ConfiguracionCuota | null;
}) {
  const [state, formAction, pending] = useActionState(
    guardarConfiguracionAction,
    inicial,
  );
  // Campos controlados: React 19 reinicia los no controlados tras una acción.
  const [campos, setCampos] = useState<CamposConfiguracion>({
    montoMensual: configuracion ? configuracion.montoMensual.toFixed(2) : "",
    diaVencimiento: configuracion ? String(configuracion.diaVencimiento) : "",
  });
  const [errCliente, setErrCliente] = useState<ErroresConfiguracion>({});

  const errores: ErroresConfiguracion = { ...state.errores, ...errCliente };
  // Tras guardar, la vigente es la que devolvió la API.
  const vigente = state.configuracion ?? configuracion;

  function set<K extends keyof CamposConfiguracion>(k: K, v: string) {
    setCampos((c) => ({ ...c, [k]: v }));
    setErrCliente((e) => ({ ...e, [k]: undefined }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const errs = validarConfiguracion(campos);
    setErrCliente(errs);
    if (Object.keys(errs).length > 0) e.preventDefault();
  }

  const ariaDe = (k: keyof CamposConfiguracion) => ({
    "aria-invalid": errores[k] ? true : undefined,
    "aria-describedby": errores[k] ? `${k}-error` : undefined,
  });

  const campo = (
    k: keyof CamposConfiguracion,
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
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Configuración de la cuota</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {vigente
            ? `Vigente desde el ${formatFecha(vigente.vigenteDesde)}: ${formatUsd(vigente.montoMensual)} con vencimiento el día ${vigente.diaVencimiento}.`
            : "Todavía no hay una configuración guardada."}{" "}
          Los cambios aplican desde la siguiente generación; las cuotas ya
          generadas conservan su monto.
        </p>
      </div>

      {state.status === "ok" && (
        <p
          role="status"
          className="rounded-md border border-green-600/40 bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-200"
        >
          Configuración guardada.
        </p>
      )}
      {state.mensajes && state.mensajes.length > 0 && (
        <div role="alert" className="text-sm text-red-600">
          {state.mensajes.map((m) => (
            <p key={m}>{m}</p>
          ))}
        </div>
      )}

      <form
        action={formAction}
        onSubmit={onSubmit}
        noValidate
        className="flex max-w-xl flex-col gap-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {campo(
            "montoMensual",
            "Monto mensual (USD)",
            <input
              id="montoMensual"
              name="montoMensual"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="45.00"
              value={campos.montoMensual}
              onChange={(e) => set("montoMensual", e.target.value)}
              onBlur={() =>
                setErrCliente((e) => ({
                  ...e,
                  montoMensual: validarMonto(campos.montoMensual),
                }))
              }
              className={inputClass}
              {...ariaDe("montoMensual")}
            />,
          )}
          {campo(
            "diaVencimiento",
            "Día de vencimiento (1 a 28)",
            <input
              id="diaVencimiento"
              name="diaVencimiento"
              type="number"
              inputMode="numeric"
              min={1}
              max={28}
              step={1}
              value={campos.diaVencimiento}
              onChange={(e) => set("diaVencimiento", e.target.value)}
              onBlur={() =>
                setErrCliente((e) => ({
                  ...e,
                  diaVencimiento: validarDia(campos.diaVencimiento),
                }))
              }
              className={inputClass}
              {...ariaDe("diaVencimiento")}
            />,
          )}
        </div>
        <div>
          <button type="submit" disabled={pending} className={btnPrimario}>
            {pending ? "Guardando..." : "Guardar configuración"}
          </button>
        </div>
      </form>
    </section>
  );
}
