'use client';
import { useState } from 'react';
import type { ComprobanteVerificacion } from '@/lib/types/asambleas';

export default function VerificarComprobantePage() {
  const [codigo, setCodigo] = useState('');
  const [resultado, setResultado] = useState<ComprobanteVerificacion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verificar = async () => {
    setError(null);
    setResultado(null);
    try {
      const res = await fetch(`/api/verificar-comprobante?codigo=${encodeURIComponent(codigo)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al verificar');
      setResultado(data as ComprobanteVerificacion);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al verificar');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <h1 className="text-2xl font-semibold">Verificar Comprobante</h1>
      <div className="flex gap-2">
        <input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="Codigo de 8 caracteres" maxLength={8} className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700" />
        <button onClick={verificar} className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">Verificar</button>
      </div>
      {error && <p className="text-red-600">{error}</p>}
      {resultado && (
        <div className="rounded-md border border-green-500 p-4">
          <p className="text-green-700 font-bold">Comprobante Valido</p>
          <p className="text-sm mt-2"><strong>Asamblea:</strong> {resultado.asamblea}</p>
          <p className="text-sm"><strong>Tema:</strong> {resultado.tema}</p>
          <p className="text-sm"><strong>Fecha:</strong> {new Date(resultado.fecha).toLocaleString()}</p>
          <p className="text-xs text-zinc-500 mt-2">La opcion votada es secreta.</p>
        </div>
      )}
    </div>
  );
}