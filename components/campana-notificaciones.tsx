'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export function CampanaNotificaciones({ inicial }: { inicial: number }) {
  const [noLeidas, setNoLeidas] = useState(inicial);
  // Cuando el servidor revalida el layout (p. ej. al marcar como leídas)
  // llega un `inicial` nuevo: se adopta en el render, sin efecto.
  const [ultimoInicial, setUltimoInicial] = useState(inicial);
  if (inicial !== ultimoInicial) {
    setUltimoInicial(inicial);
    setNoLeidas(inicial);
  }

  const actualizar = async () => {
    try {
      const res = await fetch('/api/notificaciones/conteo');
      const data = await res.json();
      setNoLeidas(data.noLeidas);
    } catch (e) {
      console.error('Error al actualizar contador', e);
    }
  };

  useEffect(() => {
    const interval = setInterval(actualizar, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link href="/notificaciones" className="relative inline-block">
      <span className="text-xl">🔔</span>
      {noLeidas > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white">
          {noLeidas}
        </span>
      )}
    </Link>
  );
}