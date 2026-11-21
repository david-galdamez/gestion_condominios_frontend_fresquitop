import { NextResponse } from 'next/server';
import { getConteoNoLeidas } from '@/lib/notificaciones';

export async function GET() {
  try {
    const data = await getConteoNoLeidas();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ noLeidas: 0 });
  }
}