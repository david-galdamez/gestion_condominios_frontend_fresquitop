'use client';

import Link from 'next/link';
import { CopiarBoton } from '@/components/copiar-boton';

export type ComprobantePresentacion = {
  temaId: string;
  tituloTema: string;
  codigoVerificacion: string;
  fecha: string;
};

type Props = {
  asambleaTitulo: string;
  comprobantes: ComprobantePresentacion[];
  onVolverDetalle?: () => void;
};

function formatFechaHoraSv(iso: string): string {
  return new Intl.DateTimeFormat('es-SV', {
    timeZone: 'America/El_Salvador',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export function ComprobantesVoto({
  asambleaTitulo,
  comprobantes,
  onVolverDetalle,
}: Props) {
  return (
    <section
      aria-label="Comprobantes de votación"
      className="flex flex-col gap-6 rounded-lg border border-green-300 bg-green-50/70 p-5 dark:border-green-900 dark:bg-green-950/40"
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white"
          >
            ✓
          </span>
          <h2 className="text-lg font-semibold text-green-900 dark:text-green-200">
            Votos registrados correctamente
          </h2>
        </div>
        <p className="text-sm text-green-800 dark:text-green-300">
          Guarda tus códigos de verificación para <strong>{asambleaTitulo}</strong>. Por secreto de
          votación, estos comprobantes no incluyen la opción elegida.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {comprobantes.map((item) => (
          <li
            key={item.temaId}
            data-testid={`comprobante-${item.temaId}`}
            className="flex flex-col justify-between gap-3 rounded-md border border-green-200 bg-white p-4 dark:border-green-900/70 dark:bg-zinc-950 sm:flex-row sm:items-center"
          >
            <div className="flex flex-col gap-1">
              <h3 className="font-medium text-foreground">{item.tituloTema}</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Emitido el{' '}
                <span className="tabular-nums">{formatFechaHoraSv(item.fecha)}</span>
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Código:</span>
                <code
                  data-testid={`codigo-${item.temaId}`}
                  className="rounded bg-zinc-100 px-2.5 py-1 font-mono text-base font-semibold tracking-widest text-foreground dark:bg-zinc-800"
                >
                  {item.codigoVerificacion}
                </code>
              </div>
            </div>

            <div className="shrink-0">
              <CopiarBoton texto={item.codigoVerificacion} etiqueta="Copiar código" />
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        {onVolverDetalle && (
          <button
            type="button"
            onClick={onVolverDetalle}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            Ver estado de la asamblea
          </button>
        )}
        <Link
          href="/asambleas"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          Volver a asambleas
        </Link>
      </div>
    </section>
  );
}