"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AreaDisponibilidad } from "@/lib/types/disponibilidad";
import {
  enlaceDisponibilidad,
  enlaceReserva,
  fechaConsultable,
  fechaMaxima,
  filtrarAreas,
  hayLibres,
  MSG_DISPONIBILIDAD as MSG,
} from "@/lib/validaciones/disponibilidad";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100";
const bloqueClass =
  "flex flex-col items-center rounded-md border px-3 py-2 text-sm min-w-24";

type Props = {
  hoy: string;
  fecha: string;
  areaId: string;
  areas: AreaDisponibilidad[];
  // Mensaje que reemplaza los bloques (p. ej. fecha fuera de rango).
  aviso?: string;
};

// FE-23.1. La fecha vive en la URL porque los datos se piden en el servidor;
// el filtro de área solo cambia lo que se muestra.
export function DisponibilidadVista({ hoy, fecha, areaId, areas, aviso }: Props) {
  const router = useRouter();
  const [cargando, start] = useTransition();
  const [fechaElegida, setFechaElegida] = useState(fecha);
  const [area, setArea] = useState(areaId);
  const [error, setError] = useState(aviso ?? "");

  function cambiarFecha(valor: string) {
    setFechaElegida(valor);
    if (!fechaConsultable(valor, hoy)) {
      setError(MSG.fueraDeRango);
      return;
    }
    setError("");
    start(() => router.push(enlaceDisponibilidad(valor, area)));
  }

  const visibles = filtrarAreas(areas, area);

  let contenido: React.ReactNode;
  if (error) {
    contenido = (
      <p role="alert" className="text-sm text-red-600">
        {error}
      </p>
    );
  } else if (cargando) {
    contenido = (
      <p role="status" aria-busy="true" className="text-sm text-zinc-600 dark:text-zinc-400">
        Cargando disponibilidad...
      </p>
    );
  } else if (areas.length === 0) {
    contenido = <p role="status">{MSG.sinAreas}</p>;
  } else {
    contenido = (
      <>
        {!hayLibres(visibles) && <p role="status">{MSG.sinHorarios}</p>}
        {visibles.map((a) => (
          <section
            key={a.id}
            aria-label={a.nombre}
            className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">{a.nombre}</h2>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Capacidad {a.capacidad} {a.capacidad === 1 ? "persona" : "personas"}
              </span>
            </div>
            <ul className="flex flex-wrap gap-2">
              {a.bloques.map((b) => (
                <li key={b.inicio}>
                  {b.estado === "LIBRE" ? (
                    <Link
                      href={enlaceReserva(a.id, fechaElegida, b.inicio)}
                      aria-label={`Reservar ${a.nombre} de ${b.inicio} a ${b.fin}`}
                      className={`${bloqueClass} border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950`}
                    >
                      <span className="font-medium">
                        {b.inicio} – {b.fin}
                      </span>
                      <span className="text-xs">Libre</span>
                    </Link>
                  ) : (
                    // Sin datos de quién reservó: solo el estado.
                    <button
                      type="button"
                      disabled
                      aria-label={`${a.nombre} de ${b.inicio} a ${b.fin}: ocupado`}
                      className={`${bloqueClass} cursor-not-allowed border-zinc-300 bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900`}
                    >
                      <span className="font-medium">
                        {b.inicio} – {b.fin}
                      </span>
                      <span className="text-xs">Ocupado</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="fecha" className="text-sm font-medium">
            Fecha
          </label>
          <input
            id="fecha"
            type="date"
            min={hoy}
            max={fechaMaxima(hoy)}
            value={fechaElegida}
            onChange={(e) => cambiarFecha(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="area" className="text-sm font-medium">
            Área
          </label>
          <select
            id="area"
            value={areas.some((a) => a.id === area) ? area : ""}
            disabled={areas.length === 0}
            onChange={(e) => setArea(e.target.value)}
            className={inputClass}
          >
            <option value="">Todas</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>
      {contenido}
    </div>
  );
}
