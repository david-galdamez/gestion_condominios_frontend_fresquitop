import { requireRol } from '@/lib/auth';
import { obtenerResultados } from '@/lib/asambleas';
import Link from 'next/link';

export default async function ResultadosPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol('ADMINISTRADOR');
  const { id } = await params;
  const r = await obtenerResultados(id);

  if (r.status === 'forbidden') return <p className="text-red-600">No tienes permiso para esta accion</p>;
  if (r.status === 'not_found') return <p className="text-red-600">La asamblea no existe</p>;
  if (r.status === 'bad_request') return <p className="text-red-600">{r.messages[0]}</p>;
  if (r.status !== 'ok') return <p className="text-red-600">Error al cargar resultados</p>;

  const data = r.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Resultados de la Asamblea</h1>
        <Link href="/admin/asambleas" className="text-sm text-blue-600 hover:underline">Volver</Link>
      </div>
      <p className="text-lg">Participacion: <strong>{data.participacion}%</strong> de las unidades convocadas.</p>
      
      {data.temas.map((tema) => (
        <div key={tema.temaId} className="rounded-md border border-zinc-300 p-4 dark:border-zinc-700">
          <h2 className="text-lg font-medium mb-2">{tema.titulo}</h2>
          {tema.empate ? <p className="text-orange-600 font-bold mb-2">{tema.mensajeEmpate}</p> 
           : tema.ganadora ? <p className="text-green-600 font-bold mb-2">Ganadora: {tema.ganadora}</p> 
           : <p className="text-zinc-500 mb-2">Sin votos registrados</p>}
          
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 dark:border-zinc-800">
              <tr><th className="py-2">Opcion</th><th className="py-2 text-right">Votos</th><th className="py-2 text-right">%</th></tr>
            </thead>
            <tbody>
              {tema.opciones.map((op) => (
                <tr key={op.opcionId} className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="py-2">{op.texto}</td>
                  <td className="py-2 text-right">{op.votos}</td>
                  <td className="py-2 text-right">{op.porcentaje}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}