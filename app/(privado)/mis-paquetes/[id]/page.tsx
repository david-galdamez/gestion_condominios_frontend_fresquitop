import { requireRol } from '@/lib/auth';
import { getDetallePaquete } from '@/lib/mis-paquetes';
import Link from 'next/link';

export default async function DetallePaquetePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol('RESIDENTE');
  const { id } = await params;
  
  try {
    const paquete = await getDetallePaquete(id);

    return (
      <div className="flex flex-col gap-6 max-w-md">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Detalle del Paquete</h1>
          <Link href="/mis-paquetes" className="text-sm text-blue-600 hover:underline">Volver</Link>
        </div>

        <div className="rounded-md border border-zinc-300 p-4 dark:border-zinc-700">
          <p className="text-lg font-medium">{paquete.codigoPaquete}</p>
          <p className="text-sm text-zinc-500">{paquete.mensajeria}</p>
          <p className="mt-2 text-sm">Estado: <strong>{paquete.estado}</strong></p>
          <p className="text-sm">Recibido: {new Date(paquete.recibidoEn).toLocaleString()}</p>
          {paquete.entregadoEn && (
            <p className="text-sm">Entregado: {new Date(paquete.entregadoEn).toLocaleString()}</p>
          )}
        </div>

        {paquete.codigoRetiro && (
          <div className="rounded-md border border-green-500 bg-green-50 p-4 text-center dark:bg-green-950">
            <p className="text-sm text-green-800 dark:text-green-200">Tu código de retiro es:</p>
            <p className="text-3xl font-bold tracking-widest text-green-800 dark:text-green-200">
              {paquete.codigoRetiro}
            </p>
            <p className="mt-1 text-xs text-green-700 dark:text-green-300">Preséntalo en portería para retirar tu paquete.</p>
          </div>
        )}
      </div>
    );
  } catch {
    return <p className="text-red-600">Paquete no encontrado</p>;
  }
}