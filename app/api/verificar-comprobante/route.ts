import { NextRequest, NextResponse } from 'next/server';
import { verificarComprobante } from '@/lib/asambleas';

export async function GET(req: NextRequest) {
  const codigo = req.nextUrl.searchParams.get('codigo');
  if (!codigo) return NextResponse.json({ message: 'Falta codigo' }, { status: 400 });

  const r = await verificarComprobante(codigo);
  if (r.status === 'ok') return NextResponse.json(r.data);
  if (r.status === 'not_found') return NextResponse.json({ message: 'Codigo no encontrado' }, { status: 404 });
  return NextResponse.json({ message: 'Error al verificar' }, { status: 500 });
}