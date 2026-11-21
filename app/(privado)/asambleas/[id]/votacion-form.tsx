'use client';

import { useState, useTransition } from 'react';
import { accionEmitirVotos } from '@/app/actions/asambleas';
import { CopiarBoton } from '@/components/copiar-boton';
import type {
  DetalleAsambleaResidente,
  TemaDetalleResidente,
  VotoItemSolicitud,
} from '@/lib/types/asambleas';
import { ComprobantesVoto, type ComprobantePresentacion } from './comprobantes-voto';

type Props = {
  asamblea: DetalleAsambleaResidente;
};

type Paso = 'seleccion' | 'resumen' | 'confirmado';

function formatFechaHoraSv(iso: string): string {
  return new Intl.DateTimeFormat('es-SV', {
    timeZone: 'America/El_Salvador',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export function VotacionForm({ asamblea }: Props) {
  const [temas, setTemas] = useState<TemaDetalleResidente[]>(asamblea.temas);
  const [votacionAbierta, setVotacionAbierta] = useState<boolean>(
    asamblea.estado === 'ABIERTA',
  );
  const [seleccion, setSeleccion] = useState<Record<string, string>>({});
  const [paso, setPaso] = useState<Paso>('seleccion');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [puedeReintentar, setPuedeReintentar] = useState(false);
  const [comprobantesNuevos, setComprobantesNuevos] = useState<ComprobantePresentacion[]>([]);
  const [enviando, startTransition] = useTransition();

  const temasPendientes = temas.filter((t) => !t.yaVoto);
  const votosSeleccionados: VotoItemSolicitud[] = temasPendientes
    .filter((t) => Boolean(seleccion[t.id]))
    .map((t) => ({
      temaId: t.id,
      opcionId: seleccion[t.id],
    }));

  const resumenSeleccion = votosSeleccionados.map((item) => {
    const tema = temas.find((t) => t.id === item.temaId);
    const opcion = tema?.opciones.find((o) => o.id === item.opcionId);
    return {
      temaId: item.temaId,
      orden: tema?.orden ?? 0,
      tituloTema: tema?.titulo ?? '',
      textoOpcion: opcion?.texto ?? '',
    };
  });

  function seleccionarOpcion(temaId: string, opcionId: string) {
    setErrorBanner(null);
    setPuedeReintentar(false);
    setSeleccion((prev) => ({ ...prev, [temaId]: opcionId }));
  }

  function irAResumen() {
    if (votosSeleccionados.length === 0) {
      setErrorBanner('Selecciona una opción en al menos un tema pendiente para continuar.');
      return;
    }
    setErrorBanner(null);
    setPuedeReintentar(false);
    setPaso('resumen');
  }

  function confirmarEnvio() {
    if (votosSeleccionados.length === 0) return;
    setErrorBanner(null);
    setPuedeReintentar(false);

    startTransition(async () => {
      const resultado = await accionEmitirVotos(asamblea.id, votosSeleccionados);

      if (resultado.ok) {
        const mapaComprobantes = new Map(
          resultado.comprobantes.map((c) => [c.temaId, c]),
        );

        const nuevosComprobantes: ComprobantePresentacion[] = resultado.comprobantes.map(
          (c) => {
            const tema = temas.find((t) => t.id === c.temaId);
            return {
              temaId: c.temaId,
              tituloTema: tema?.titulo ?? 'Tema votado',
              codigoVerificacion: c.codigoVerificacion,
              fecha: c.fecha,
            };
          },
        );

        setTemas((prev) =>
          prev.map((tema) => {
            const comp = mapaComprobantes.get(tema.id);
            if (!comp) return tema;
            return {
              ...tema,
              yaVoto: true,
              codigoVerificacion: comp.codigoVerificacion,
              fechaVoto: comp.fecha,
            };
          }),
        );
        setSeleccion({});
        setComprobantesNuevos(nuevosComprobantes);
        setPaso('confirmado');
        return;
      }

      if (resultado.codigo === 'ya_voto') {
        const enviadosSet = new Set(votosSeleccionados.map((v) => v.temaId));
        setTemas((prev) =>
          prev.map((tema) =>
            enviadosSet.has(tema.id) ? { ...tema, yaVoto: true } : tema,
          ),
        );
        setSeleccion((prev) => {
          const next = { ...prev };
          for (const id of enviadosSet) delete next[id];
          return next;
        });
        setErrorBanner('Tu unidad ya votó este tema');
        setPaso('seleccion');
        return;
      }

      if (resultado.codigo === 'no_abierta') {
        setVotacionAbierta(false);
        setErrorBanner('La votación no está abierta');
        setPaso('seleccion');
        return;
      }

      setErrorBanner(resultado.error);
      setPuedeReintentar(resultado.codigo === 'error');
    });
  }

  if (!votacionAbierta) {
    return (
      <div className="flex flex-col gap-6">
        <div
          role="alert"
          className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
        >
          <p className="font-semibold">La votación no está abierta</p>
          <p className="mt-1">
            {asamblea.estado === 'PUBLICADA'
              ? `Podrás emitir el voto de tu unidad a partir del ${formatFechaHoraSv(asamblea.fechaApertura)}.`
              : 'El periodo de votación para esta asamblea ha finalizado.'}
          </p>
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Temas de la asamblea</h2>
          {temas.map((tema) => (
            <article
              key={tema.id}
              className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium">
                  Tema {tema.orden}: {tema.titulo}
                </h3>
                {tema.yaVoto && (
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
                    Votado
                  </span>
                )}
              </div>

              {tema.yaVoto && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-green-200 bg-white px-3 py-2 text-xs dark:border-green-900 dark:bg-zinc-950">
                  <span className="text-zinc-700 dark:text-zinc-300">
                    🔒 Tu unidad ya votó este tema
                    {tema.codigoVerificacion ? ` — Comprobante: ${tema.codigoVerificacion}` : ''}
                    {tema.fechaVoto ? ` (${formatFechaHoraSv(tema.fechaVoto)})` : ''}
                  </span>
                  {tema.codigoVerificacion && (
                    <CopiarBoton texto={tema.codigoVerificacion} etiqueta="Copiar código" />
                  )}
                </div>
              )}

              <ul className="flex flex-wrap gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                {tema.opciones.map((op) => (
                  <li
                    key={op.id}
                    className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    {op.texto}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      </div>
    );
  }

  if (paso === 'confirmado' && comprobantesNuevos.length > 0) {
    return (
      <ComprobantesVoto
        asambleaTitulo={asamblea.titulo}
        comprobantes={comprobantesNuevos}
        onVolverDetalle={() => setPaso('seleccion')}
      />
    );
  }

  if (paso === 'resumen') {
    return (
      <section
        aria-label="Resumen previo a confirmar voto"
        className="flex flex-col gap-5 rounded-lg border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">Revisa tu voto antes de confirmar</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Verifica tu selección en cada tema antes de emitir el voto de tu unidad.
          </p>
        </div>

        <div
          role="note"
          className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
        >
          <strong>Aviso importante:</strong> Tu voto es secreto y definitivo. Una vez confirmado, no
          se puede modificar ni anular.
        </div>

        {errorBanner && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300"
          >
            <span>{errorBanner}</span>
            {puedeReintentar && (
              <button
                type="button"
                disabled={enviando}
                onClick={confirmarEnvio}
                className="rounded-md border border-red-400 px-3 py-1 text-xs font-medium hover:bg-red-100 disabled:opacity-60 dark:border-red-700 dark:hover:bg-red-900"
              >
                Reintentar
              </button>
            )}
          </div>
        )}

        <ul className="flex flex-col gap-3">
          {resumenSeleccion.map((item) => (
            <li
              key={item.temaId}
              className="flex flex-col gap-1 rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Tema {item.orden}
              </span>
              <span className="font-medium text-foreground">{item.tituloTema}</span>
              <span className="text-sm text-blue-700 dark:text-blue-300">
                Opción seleccionada: <strong>{item.textoOpcion}</strong>
              </span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <button
            type="button"
            disabled={enviando}
            onClick={() => {
              setErrorBanner(null);
              setPuedeReintentar(false);
              setPaso('seleccion');
            }}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Volver a editar
          </button>
          <button
            type="button"
            disabled={enviando}
            onClick={confirmarEnvio}
            className="rounded-md bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {enviando ? 'Enviando votos...' : 'Confirmar voto'}
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {errorBanner && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300"
        >
          {errorBanner}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <section className="flex flex-col gap-4" aria-label="Temas a votar por tu unidad">
          <h2 className="text-lg font-semibold">Temas a votar por tu unidad</h2>

          {temas.map((tema) => {
            const opcionMarcada = seleccion[tema.id] ?? '';

            if (tema.yaVoto) {
              return (
                <article
                  key={tema.id}
                  data-testid={`tema-bloqueado-${tema.id}`}
                  className="flex flex-col gap-3 rounded-lg border border-zinc-300 bg-zinc-100/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/70"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-medium text-foreground">
                      Tema {tema.orden}: {tema.titulo}
                    </h3>
                    <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
                      Votado
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950">
                    <p className="text-zinc-700 dark:text-zinc-300">
                      <span aria-hidden="true">🔒 </span>
                      Tu unidad ya votó este tema
                      {tema.codigoVerificacion && (
                        <>
                          {' '}
                          — Comprobante:{' '}
                          <code className="font-mono font-semibold tracking-wider">
                            {tema.codigoVerificacion}
                          </code>
                        </>
                      )}
                      {tema.fechaVoto && (
                        <span className="text-xs text-zinc-500">
                          {' '}
                          ({formatFechaHoraSv(tema.fechaVoto)})
                        </span>
                      )}
                    </p>
                    {tema.codigoVerificacion && (
                      <CopiarBoton texto={tema.codigoVerificacion} etiqueta="Copiar código" />
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2" aria-disabled="true">
                    {tema.opciones.map((opcion) => (
                      <label
                        key={opcion.id}
                        className="inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
                      >
                        <input
                          type="radio"
                          name={`tema-${tema.id}`}
                          value={opcion.id}
                          checked={false}
                          disabled
                          readOnly
                          className="h-4 w-4"
                        />
                        <span>{opcion.texto}</span>
                      </label>
                    ))}
                  </div>
                </article>
              );
            }

            return (
              <fieldset
                key={tema.id}
                className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <legend className="font-medium text-foreground">
                    Tema {tema.orden}: {tema.titulo}
                  </legend>
                  <span
                    className={
                      opcionMarcada
                        ? 'shrink-0 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }
                  >
                    {opcionMarcada ? 'Seleccionado' : 'Pendiente'}
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {tema.opciones.map((opcion) => {
                    const seleccionada = opcionMarcada === opcion.id;
                    return (
                      <label
                        key={opcion.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors ${
                          seleccionada
                            ? 'border-blue-600 bg-blue-50 font-medium text-blue-900 dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-200'
                            : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`tema-${tema.id}`}
                          value={opcion.id}
                          checked={seleccionada}
                          onChange={() => seleccionarOpcion(tema.id, opcion.id)}
                          className="h-4 w-4 accent-blue-700"
                        />
                        <span>{opcion.texto}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </section>

        <aside
          aria-label="Resumen de votación"
          className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60 lg:sticky lg:top-6"
        >
          <h2 className="text-base font-semibold">Resumen de votación</h2>

          <ul className="flex flex-col gap-2 text-sm">
            {temas.map((tema) => (
              <li
                key={tema.id}
                className="flex items-center justify-between gap-2 border-b border-zinc-200 pb-2 last:border-b-0 last:pb-0 dark:border-zinc-800"
              >
                <span className="font-medium">Tema {tema.orden}</span>
                {tema.yaVoto ? (
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">
                    Votado (Comprobante generado)
                  </span>
                ) : seleccion[tema.id] ? (
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                    Seleccionado
                  </span>
                ) : (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Pendiente</span>
                )}
              </li>
            ))}
          </ul>

          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Al confirmar se generarán los comprobantes de voto secreto de los temas pendientes.
          </p>

          {temasPendientes.length > 0 ? (
            <button
              type="button"
              disabled={votosSeleccionados.length === 0}
              onClick={irAResumen}
              className="w-full rounded-md bg-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Revisar voto ({votosSeleccionados.length})
            </button>
          ) : (
            <p className="rounded-md bg-green-100 px-3 py-2 text-center text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
              Tu unidad ya completó todos los temas de esta asamblea.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}