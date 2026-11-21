'use client';

import { useState, useTransition } from 'react';
import { accionPublicarAsamblea } from '@/app/actions/asambleas';

type Props = { id: string };

type Resultado = { ok: true; unidadesConvocadas: number } | { ok: false; error: string } | null;

export function PublicarButton({ id }: Props) {
  const [resultado, setResultado] = useState<Resultado>(null);
  const [pending, startTransition] = useTransition();

  function publicar() {
    if (!window.confirm('¿Publicar la asamblea? Ya no se podrá editar y se notificará a todos los residentes.')) {
      return;
    }
    setResultado(null);
    startTransition(async () => {
      setResultado(await accionPublicarAsamblea(id));
    });
  }

  if (resultado?.ok) {
    return (
      <span role="status" className="text-sm text-green-700">
        Publicada · {resultado.unidadesConvocadas} unidades convocadas
      </span>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={publicar}
        disabled={pending}
        className="rounded-md bg-foreground px-3 py-1 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Publicando…' : 'Publicar'}
      </button>
      {resultado && !resultado.ok && (
        <p role="alert" className="text-sm text-red-600">
          {resultado.error}
        </p>
      )}
    </div>
  );
}
