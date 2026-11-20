import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DetalleAsambleaResidente } from '@/lib/types/asambleas';

const emitirMock = vi.fn();
vi.mock('@/app/actions/asambleas', () => ({
  accionEmitirVotos: (...args: unknown[]) => emitirMock(...args),
}));

import { VotacionForm } from './votacion-form';

function crearAsamblea(
  overrides: Partial<DetalleAsambleaResidente> = {},
): DetalleAsambleaResidente {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    titulo: 'Asamblea General Ordinaria',
    descripcion: 'Votación de temas anuales del condominio',
    fechaApertura: '2026-11-20T14:00:00.000Z',
    fechaCierre: '2026-11-20T22:00:00.000Z',
    estado: 'ABIERTA',
    temasVotados: [],
    temas: [
      {
        id: 'tema-1',
        titulo: 'Aprobación del presupuesto 2027',
        orden: 1,
        yaVoto: false,
        codigoVerificacion: null,
        fechaVoto: null,
        opciones: [
          { id: 'op-1a', texto: 'A favor', orden: 1 },
          { id: 'op-1b', texto: 'En contra', orden: 2 },
        ],
      },
      {
        id: 'tema-2',
        titulo: 'Renovación de fachada',
        orden: 2,
        yaVoto: false,
        codigoVerificacion: null,
        fechaVoto: null,
        opciones: [
          { id: 'op-2a', texto: 'Sí', orden: 1 },
          { id: 'op-2b', texto: 'No', orden: 2 },
        ],
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  emitirMock.mockReset();
});

describe('VotacionForm · H12 (FE-12.1 y FE-12.2)', () => {
  it('permite seleccionar opciones, navegar al resumen previo y volver a editar conservando lo marcado', async () => {
    const user = userEvent.setup();
    render(<VotacionForm asamblea={crearAsamblea()} />);

    const btnRevisar = screen.getByRole('button', { name: /Revisar voto/i });
    expect(btnRevisar).toBeDisabled();

    await user.click(screen.getByLabelText('A favor'));
    await user.click(screen.getByLabelText('No'));

    expect(btnRevisar).toBeEnabled();
    await user.click(btnRevisar);

    expect(
      screen.getByRole('heading', { name: /Revisa tu voto antes de confirmar/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/secreto y definitivo/i)).toBeInTheDocument();
    expect(screen.getByText('Aprobación del presupuesto 2027')).toBeInTheDocument();
    expect(screen.getByText('A favor')).toBeInTheDocument();
    expect(screen.getByText('Renovación de fachada')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Volver a editar' }));

    expect(screen.getByLabelText('A favor')).toBeChecked();
    expect(screen.getByLabelText('No')).toBeChecked();
    expect(emitirMock).not.toHaveBeenCalled();
  });

  it('confirma el voto y muestra el comprobante con código de 8 caracteres SIN revelar la opción elegida', async () => {
    emitirMock.mockResolvedValue({
      ok: true,
      comprobantes: [
        {
          temaId: 'tema-1',
          codigoVerificacion: 'K7Q2M9XA',
          fecha: '2026-11-20T15:30:00.000Z',
        },
      ],
    });

    const user = userEvent.setup();
    render(<VotacionForm asamblea={crearAsamblea()} />);

    await user.click(screen.getByLabelText('A favor'));
    await user.click(screen.getByRole('button', { name: /Revisar voto/i }));
    await user.click(screen.getByRole('button', { name: 'Confirmar voto' }));

    expect(emitirMock).toHaveBeenCalledTimes(1);
    expect(emitirMock).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111', [
      { temaId: 'tema-1', opcionId: 'op-1a' },
    ]);

    const comprobante = await screen.findByTestId('comprobante-tema-1');
    expect(screen.getByTestId('codigo-tema-1')).toHaveTextContent('K7Q2M9XA');
    expect(within(comprobante).getByText('Aprobación del presupuesto 2027')).toBeInTheDocument();
    expect(
      within(comprobante).getByRole('button', { name: 'Copiar código' }),
    ).toBeInTheDocument();

    // Regla de voto secreto: el comprobante jamás revela la opción elegida
    expect(comprobante).not.toHaveTextContent('A favor');
    expect(comprobante).not.toHaveTextContent('En contra');
    expect(comprobante).not.toHaveTextContent('op-1a');
  });

  it('bloquea temas ya votados con "Tu unidad ya votó este tema" (precargado y sin revelar opción)', () => {
    const asamblea = crearAsamblea({
      temasVotados: ['tema-2'],
      temas: [
        ...crearAsamblea().temas.slice(0, 1),
        {
          id: 'tema-2',
          titulo: 'Reglamento de mascotas',
          orden: 2,
          yaVoto: true,
          codigoVerificacion: 'M8P4T2ZR',
          fechaVoto: '2026-11-20T14:15:00.000Z',
          opciones: [
            { id: 'op-2a', texto: 'Sí', orden: 1 },
            { id: 'op-2b', texto: 'No', orden: 2 },
          ],
        },
      ],
    });

    render(<VotacionForm asamblea={asamblea} />);

    const bloqueado = screen.getByTestId('tema-bloqueado-tema-2');
    expect(within(bloqueado).getByText(/Tu unidad ya votó este tema/i)).toBeInTheDocument();
    expect(within(bloqueado).getByText('M8P4T2ZR')).toBeInTheDocument();

    const radiosBloqueados = within(bloqueado).getAllByRole('radio');
    expect(radiosBloqueados).toHaveLength(2);
    for (const radio of radiosBloqueados) {
      expect(radio).toBeDisabled();
      expect(radio).not.toBeChecked();
    }
  });

  it('muestra "Tu unidad ya votó este tema" y bloquea el tema ante error 409 de voto duplicado', async () => {
    emitirMock.mockResolvedValue({
      ok: false,
      codigo: 'ya_voto',
      error: 'Tu unidad ya votó este tema',
    });

    const user = userEvent.setup();
    render(<VotacionForm asamblea={crearAsamblea()} />);

    await user.click(screen.getByLabelText('A favor'));
    await user.click(screen.getByRole('button', { name: /Revisar voto/i }));
    await user.click(screen.getByRole('button', { name: 'Confirmar voto' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Tu unidad ya votó este tema');
    expect(screen.getByTestId('tema-bloqueado-tema-1')).toBeInTheDocument();
  });

  it('muestra "La votación no está abierta" sin controles de votación cuando está PUBLICADA o CERRADA', () => {
    const { rerender } = render(
      <VotacionForm asamblea={crearAsamblea({ estado: 'PUBLICADA' })} />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('La votación no está abierta');
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Revisar voto/i })).not.toBeInTheDocument();

    rerender(<VotacionForm asamblea={crearAsamblea({ estado: 'CERRADA' })} />);

    expect(screen.getByRole('alert')).toHaveTextContent('La votación no está abierta');
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Revisar voto/i })).not.toBeInTheDocument();
  });

  it('muestra "La votación no está abierta" si el servidor responde 409 por cierre durante el envío', async () => {
    emitirMock.mockResolvedValue({
      ok: false,
      codigo: 'no_abierta',
      error: 'La votación no está abierta',
    });

    const user = userEvent.setup();
    render(<VotacionForm asamblea={crearAsamblea()} />);

    await user.click(screen.getByLabelText('A favor'));
    await user.click(screen.getByRole('button', { name: /Revisar voto/i }));
    await user.click(screen.getByRole('button', { name: 'Confirmar voto' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La votación no está abierta');
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });
});