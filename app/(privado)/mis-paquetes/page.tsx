import { requireRol } from '@/lib/auth';
import { getMisPaquetes } from '@/lib/mis-paquetes';
import Link from 'next/link';

export default async function MisPaquetesPage({ searchParams }: { searchParams: Promise<{ filtro?: string; pagina?: string }> }) {
  await requireRol('RESIDENTE');
  const { filtro = 'TODOS', pagina = '1' } = await searchParams;
  const p = parseInt(pagina, 10) || 1;

  try {
    const data = await getMisPaquetes(filtro, p);

    return (
      <div className="flex flex-col gap-6 max-w-3xl">
        <h1 className="text-2xl font-semibold">Mis Paquetes</h1>

        {/* Filtros */}
        <div className="flex gap-2">
          {['TODOS', 'POR_RETIRAR', 'ENTREGADOS'].map((f) => (
            <Link
              key={f}
              href={`/mis-paquetes?filtro=${f}`}
              className={`rounded-full px-4 py-1 text-sm border ${filtro === f ? 'bg-foreground text-background' : 'border-zinc-300 dark:border-zinc-700'}`}
            >
              {f === 'POR_RETIRAR' ? 'Por retirar' : f === 'ENTREGADOS' ? 'Entregados' : 'Todos'}
            </Link>
          ))}
        </div>

        {data.datos.length === 0 ? (
          <p className="text-zinc-500 py-8 text-center">No tienes paquetes con este filtro</p>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-2 pr-4 font-medium">Código</th>
                  <th className="py-2 pr-4 font-medium">Llegada</th>
                  <th className="py-2 pr-4 font-medium">Mensajería</th>
                  <th className="py-2 pr-4 font-medium">Estado</th>
                  <th className="py-2 font-medium">Entrega</th>
                </tr>
              </thead>
              <tbody>
                {data.datos.map((p: any) => (
                  <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-900">
                    <td className="py-2 pr-4">
                      <Link href={`/mis-paquetes/${p.id}`} className="text-blue-600 hover:underline">
                        {p.codigoPaquete}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">
                      {new Date(p.recibidoEn).toLocaleDateString('es-SV')}
                    </td>
                    <td className="py-2 pr-4">{p.mensajeria}</td>
                    <td className="py-2 pr-4">{p.estado}</td>
                    <td className="py-2">
                      {p.entregadoEn ? new Date(p.entregadoEn).toLocaleDateString('es-SV') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginación simple */}
            {data.totalPaginas > 1 && (
              <div className="flex justify-between items-center">
                <Link
                  href={`/mis-paquetes?filtro=${filtro}&pagina=${p - 1}`}
                  className={`text-sm ${p <= 1 ? 'pointer-events-none opacity-50' : 'underline'}`}
                >
                  Anterior
                </Link>
                <span className="text-sm">Página {p} de {data.totalPaginas}</span>
                <Link
                  href={`/mis-paquetes?filtro=${filtro}&pagina=${p + 1}`}
                  className={`text-sm ${p >= data.totalPaginas ? 'pointer-events-none opacity-50' : 'underline'}`}
                >
                  Siguiente
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    );
  } catch (error) {
    return (
      <div className="flex flex-col gap-6 max-w-3xl">
        <h1 className="text-2xl font-semibold">Mis Paquetes</h1>
        <div className="rounded-md border border-red-300 bg-red-50 p-4 dark:bg-red-950">
          <p className="text-red-700 dark:text-red-300">
            <strong>Error:</strong> {error instanceof Error ? error.message : 'Error desconocido'}
          </p>
        </div>
      </div>
    );
  }
}