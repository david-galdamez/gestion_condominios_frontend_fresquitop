import {
  registrarEntradaCodigoAction,
  registrarSalidaAction,
} from "@/app/actions/accesos";
import { EstadoAutorizacionBadge } from "@/components/estado-autorizacion-badge";
import { formatFecha } from "@/lib/format";
import type { Acceso } from "@/lib/types/accesos";
import type { Autorizacion } from "@/lib/types/visitas";
import { formatHora } from "@/lib/validaciones/acceso";

const tarjeta =
  "flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800";
const btnPrimario =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background";
const btnSecundario =
  "rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700";

const documento = (tipo: string, numero: string) => `${tipo} ${numero}`;

// Autorizaciones de hoy: "Registrar entrada" solo si siguen vigentes.
export function ListaAutorizaciones({
  autorizaciones,
  q,
  hoy,
}: {
  autorizaciones: Autorizacion[];
  q: string;
  hoy: string;
}) {
  return (
    <ul className="flex flex-col gap-3" aria-label="Autorizaciones de hoy">
      {autorizaciones.map((a) => (
        <li key={a.id} className={tarjeta}>
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-base font-medium">{a.nombre}</span>
              <EstadoAutorizacionBadge estado={a.estado} />
            </div>
            <span className="text-zinc-600 dark:text-zinc-400">
              {documento(a.tipoDocumento, a.numeroDocumento)} · Unidad{" "}
              {a.unidad.codigo}
            </span>
            <span className="text-zinc-600 dark:text-zinc-400">
              Código {a.codigo} · {formatFecha(a.fechaVisita)} a las{" "}
              {a.horaEstimada}
            </span>
          </div>
          {a.estado === "VIGENTE" && a.fechaVisita === hoy && (
            <form action={registrarEntradaCodigoAction}>
              <input type="hidden" name="codigo" value={a.codigo} />
              <input type="hidden" name="q" value={q} />
              <button type="submit" className={btnPrimario}>
                Registrar entrada
              </button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}

// Visitantes dentro: "Registrar salida".
export function ListaDentro({ accesos, q }: { accesos: Acceso[]; q: string }) {
  return (
    <ul className="flex flex-col gap-3" aria-label="Visitantes dentro">
      {accesos.map((a) => (
        <li key={a.id} className={tarjeta}>
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-base font-medium">{a.nombre}</span>
            <span className="text-zinc-600 dark:text-zinc-400">
              {documento(a.tipoDocumento, a.numeroDocumento)} · Unidad{" "}
              {a.unidad}
            </span>
            <span className="text-zinc-600 dark:text-zinc-400">
              Entró a las {formatHora(a.horaEntrada)} ·{" "}
              {a.preautorizado ? "Pre-autorizado" : `No pre-autorizado: ${a.motivo ?? ""}`}
            </span>
          </div>
          <form action={registrarSalidaAction}>
            <input type="hidden" name="id" value={a.id} />
            <input type="hidden" name="q" value={q} />
            <button type="submit" className={btnSecundario}>
              Registrar salida
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
