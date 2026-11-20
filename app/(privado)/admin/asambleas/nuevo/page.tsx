import type { Metadata } from 'next';
import { requireRol } from '@/lib/auth';
import { AsambleaForm } from './asamblea-form';

export const metadata: Metadata = { title: 'Nueva asamblea' };

export default async function NuevaAsambleaPage() {
  await requireRol('ADMINISTRADOR');
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Convocar nueva asamblea</h1>
      <AsambleaForm />
    </div>
  );
}
