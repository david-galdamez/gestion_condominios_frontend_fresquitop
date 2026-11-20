"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  asignarReporteAction,
  type AsignarReporteState,
} from "@/app/actions/reportes";
import { PrioridadReporteBadge } from "@/components/prioridad-reporte-badge";
import { PRIORIDAD_REPORTE_LABEL } from "@/lib/reportes-ui";
import {
  PRIORIDADES_REPORTE,
  type EstadoReporte,
  type PrioridadReporte,
} from "@/lib/types/reportes";
import {
  RESPONSABLE_MAX,
  RESPONSABLE_MIN,
  validarAsignacionReporte,
} from "@/lib/validaciones/reporte-asignacion";

const fieldClass =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100";

export function AsignacionReporteForm({
  reporteId,
  estadoInicial,
  prioridadInicial,
  responsableInicial,
}: {
  reporteId: string;
  estadoInicial: EstadoReporte;
  prioridadInicial: PrioridadReporte | null;
  responsableInicial: string | null;
}) {
  const router = useRouter();
  const [prioridad, setPrioridad] = useState<string>(prioridadInicial ?? "");
  const [responsable, setResponsable] = useState<string>(
    responsableInicial ?? "",
  );
  const [errorCliente, setErrorCliente] = useState<string | null>(null);

  const actionConId = asignarReporteAction.bind(null, reporteId);
  const [state, formAction, isPending] = useActionState<
    AsignarReporteState,
    FormData
  >(actionConId, { status: "idle" });

  useEffect(() => {
    if (state.status === "ok") {
      // Actualiza estado e historial renderizados por el Server Component sin recarga manual.
      router.refresh();
    }
  }, [state, router]);

  if (estadoInicial === "RESUELTO") {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-300 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-base font-semibold">Asignación</h2>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Este reporte está resuelto y no admite cambios en su asignación.
        </p>
        <dl className="flex flex-col gap-3 text-sm">
          <div>
            <dt className="text-zinc-600 dark:text-zinc-400">Prioridad</dt>
            <dd className="mt-1">
              <PrioridadReporteBadge prioridad={prioridadInicial} />
            </dd>
          </div>
          <div>
            <dt className="text-zinc-600 dark:text-zinc-400">Responsable</dt>
            <dd className="mt-1 font-medium">
              {responsableInicial ?? "Sin asignar"}
            </dd>
          </div>
        </dl>
      </div>
    );
  }

  const faltaCampo = !prioridad.trim() || responsable.trim().length === 0;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const err = validarAsignacionReporte({ prioridad, responsable });
    if (err) {
      e.preventDefault();
      setErrorCliente(err);
      return;
    }
    setErrorCliente(null);
  }

  const mensajeError =
    errorCliente ?? (state.status === "error" ? state.mensaje : null);

  return (
    <form
      action={formAction}
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-xl border border-zinc-300 bg-background p-5 dark:border-zinc-800"
    >
      <h2 className="text-base font-semibold">Priorizar y asignar</h2>

      {state.status === "ok" && (
        <div
          role="status"
          className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
        >
          {state.mensaje}
        </div>
      )}

      {mensajeError && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {mensajeError}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="prioridad" className="text-sm font-medium">
          Asignar Prioridad <span className="text-red-600">*</span>
        </label>
        <select
          id="prioridad"
          name="prioridad"
          value={prioridad}
          onChange={(e) => {
            setPrioridad(e.target.value);
            setErrorCliente(null);
          }}
          className={fieldClass}
        >
          <option value="">Seleccionar</option>
          {PRIORIDADES_REPORTE.map((p) => (
            <option key={p} value={p}>
              {PRIORIDAD_REPORTE_LABEL[p]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="responsable" className="text-sm font-medium">
          Asignar Responsable <span className="text-red-600">*</span>
        </label>
        <input
          id="responsable"
          name="responsable"
          type="text"
          value={responsable}
          onChange={(e) => {
            setResponsable(e.target.value);
            setErrorCliente(null);
          }}
          minLength={RESPONSABLE_MIN}
          maxLength={RESPONSABLE_MAX}
          placeholder="Escriba nombre o proveedor..."
          className={fieldClass}
        />
        <span className="text-xs text-zinc-500">
          Entre {RESPONSABLE_MIN} y {RESPONSABLE_MAX} caracteres.
        </span>
      </div>

      <button
        type="submit"
        disabled={faltaCampo || isPending}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Guardando..." : "Guardar asignación"}
      </button>
    </form>
  );
}