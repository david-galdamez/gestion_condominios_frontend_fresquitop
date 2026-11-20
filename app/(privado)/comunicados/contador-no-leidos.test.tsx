import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const contar = vi.fn();
vi.mock("@/app/actions/comunicados", () => ({
  contarNoLeidos: () => contar(),
}));

import { ContadorNoLeidos, INTERVALO_CONTADOR_MS } from "./contador-no-leidos";

// Deja que se resuelvan las promesas pendientes del efecto.
const vaciarPromesas = () => act(async () => {});

beforeEach(() => {
  contar.mockReset();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe("ContadorNoLeidos", () => {
  it("muestra el valor inicial y lo actualiza al abrir la pantalla", async () => {
    contar.mockResolvedValue(2);
    render(<ContadorNoLeidos inicial={3} />);
    expect(screen.getByRole("status")).toHaveTextContent("3 sin leer");
    await vaciarPromesas();
    expect(contar).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent("2 sin leer");
  });

  it("se vuelve a consultar cada 30 segundos", async () => {
    contar.mockResolvedValueOnce(3).mockResolvedValueOnce(1);
    render(<ContadorNoLeidos inicial={3} />);
    await vaciarPromesas();
    expect(contar).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(INTERVALO_CONTADOR_MS - 1);
    });
    expect(contar).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(contar).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("status")).toHaveTextContent("1 sin leer");
  });

  it("si la consulta falla conserva el último valor", async () => {
    contar.mockResolvedValue(null);
    render(<ContadorNoLeidos inicial={4} />);
    await vaciarPromesas();
    expect(screen.getByRole("status")).toHaveTextContent("4 sin leer");
  });

  it("con 0 dice que no hay pendientes; sin dato no muestra nada", async () => {
    contar.mockResolvedValue(null);
    const { rerender, container } = render(<ContadorNoLeidos inicial={0} />);
    expect(screen.getByRole("status")).toHaveTextContent("Sin pendientes");
    rerender(<ContadorNoLeidos key="otro" inicial={null} />);
    await vaciarPromesas();
    expect(container).toBeEmptyDOMElement();
  });

  it("deja de consultar al salir de la pantalla", async () => {
    contar.mockResolvedValue(1);
    const { unmount } = render(<ContadorNoLeidos inicial={1} />);
    await vaciarPromesas();
    unmount();
    await act(async () => {
      vi.advanceTimersByTime(INTERVALO_CONTADOR_MS * 3);
    });
    expect(contar).toHaveBeenCalledTimes(1);
  });
});
