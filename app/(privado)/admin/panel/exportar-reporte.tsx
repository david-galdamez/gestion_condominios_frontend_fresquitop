"use client";

import { useEffect, useRef, useState } from "react";
import {
  descargar,
  MSG_SIN_PERIODO,
  pedirReporte,
  type FormatoExportacion,
  type VersionExportacion,
} from "@/lib/exportar-reporte";

const FORMATOS: { valor: FormatoExportacion; etiqueta: string }[] = [
  { valor: "PDF", etiqueta: "PDF" },
  { valor: "EXCEL", etiqueta: "Excel" },
];
const VERSIONES: { valor: VersionExportacion; etiqueta: string }[] = [
  { valor: "DETALLADA", etiqueta: "Detallada" },
  { valor: "RESUMIDA", etiqueta: "Resumida" },
];
const AYUDA_VERSION: Record<VersionExportacion, string> = {
  RESUMIDA: "Resumida: solo totales, sin unidades ni nombres de residentes.",
  DETALLADA: "Detallada: agrega la morosidad por unidad.",
};

// FE-20.1 / FE-20.2 · Exporta el mismo periodo que muestra el panel.
// Sin periodo válido el botón queda deshabilitado con "Selecciona un periodo".
export function ExportarReporte({
  periodo,
  descripcion,
}: {
  periodo: { desde: string; hasta: string } | null;
  descripcion: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [formato, setFormato] = useState<FormatoExportacion>("PDF");
  const [version, setVersion] = useState<VersionExportacion>("RESUMIDA");
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enCurso = useRef(false);

  useEffect(() => {
    if (!abierto) return;
    const alEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !enCurso.current) setAbierto(false);
    };
    window.addEventListener("keydown", alEscape);
    return () => window.removeEventListener("keydown", alEscape);
  }, [abierto]);

  function abrir() {
    setFormato("PDF");
    setVersion("RESUMIDA");
    setError(null);
    setAbierto(true);
  }

  async function onDescargar() {
    // Evita dos descargas simultáneas aunque el clic llegue antes del re-render.
    if (!periodo || enCurso.current) return;
    enCurso.current = true;
    setGenerando(true);
    setError(null);
    const r = await pedirReporte({ formato, version, ...periodo });
    enCurso.current = false;
    setGenerando(false);
    if (!r.ok) return setError(r.mensaje);
    descargar(r.archivo, r.nombre);
    setAbierto(false);
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <button
        type="button"
        onClick={abrir}
        disabled={!periodo}
        aria-describedby={periodo ? undefined : "exportar-sin-periodo"}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Exportar
      </button>
      {!periodo && (
        <p id="exportar-sin-periodo" className="text-xs text-zinc-600 dark:text-zinc-400">
          {MSG_SIN_PERIODO}
        </p>
      )}

      {abierto && periodo && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="exportar-titulo"
            className="flex w-full max-w-md flex-col gap-5 rounded-xl bg-background p-5 shadow-lg"
          >
            <div className="flex flex-col gap-1">
              <h2 id="exportar-titulo" className="text-lg font-semibold">
                Exportar reporte
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Periodo: {descripcion}
              </p>
            </div>

            <fieldset disabled={generando} className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium">Formato</legend>
              <div className="flex gap-6">
                {FORMATOS.map((f) => (
                  <label key={f.valor} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="formato"
                      value={f.valor}
                      checked={formato === f.valor}
                      onChange={() => setFormato(f.valor)}
                    />
                    {f.etiqueta}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset disabled={generando} className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium">Versión</legend>
              <div className="flex gap-6">
                {VERSIONES.map((v) => (
                  <label key={v.valor} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="version"
                      value={v.valor}
                      checked={version === v.valor}
                      onChange={() => setVersion(v.valor)}
                    />
                    {v.etiqueta}
                  </label>
                ))}
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {AYUDA_VERSION[version]}
              </p>
            </fieldset>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex justify-between gap-2">
              <button
                type="button"
                disabled={generando}
                onClick={() => setAbierto(false)}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm disabled:opacity-60 dark:border-zinc-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={generando}
                aria-busy={generando}
                onClick={onDescargar}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {generando && (
                  <span
                    aria-hidden="true"
                    className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  />
                )}
                {generando ? "Generando..." : "Descargar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
