import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const publicarMock = vi.fn();
vi.mock('@/app/actions/asambleas', () => ({
  accionPublicarAsamblea: (...args: unknown[]) => publicarMock(...args),
}));

import { PublicarButton } from './publicar-button';

describe('PublicarButton', () => {
  beforeEach(() => {
    publicarMock.mockReset();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });
  afterEach(() => vi.restoreAllMocks());

  it('muestra el error del backend', async () => {
    publicarMock.mockResolvedValue({ ok: false, error: 'Publica con al menos 48 horas de anticipación' });
    render(<PublicarButton id="a1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Publica con al menos 48 horas de anticipación');
    expect(publicarMock).toHaveBeenCalledWith('a1');
  });

  it('muestra el éxito con las unidades convocadas', async () => {
    publicarMock.mockResolvedValue({ ok: true, unidadesConvocadas: 12 });
    render(<PublicarButton id="a1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }));
    expect(await screen.findByText('Publicada · 12 unidades convocadas')).toBeTruthy();
  });

  it('no llama a la acción si el usuario cancela la confirmación', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<PublicarButton id="a1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }));
    expect(publicarMock).not.toHaveBeenCalled();
  });
});
