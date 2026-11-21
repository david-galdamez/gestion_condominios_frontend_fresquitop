import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CopiarBoton } from "./copiar-boton";

function mockClipboard(writeText?: (t: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    value: writeText ? { writeText } : undefined,
    configurable: true,
  });
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  mockClipboard(undefined);
});

const clic = () =>
  act(async () => {
    fireEvent.click(screen.getByRole("button"));
  });

describe("CopiarBoton", () => {
  it("copia el texto exacto, muestra ¡Copiado! y vuelve a los 2 s", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    render(<CopiarBoton texto="482915" />);
    expect(screen.getByText("Copiar código")).toBeInTheDocument();
    await clic();
    expect(writeText).toHaveBeenCalledWith("482915");
    expect(screen.getByText("¡Copiado!")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText("Copiar código")).toBeInTheDocument();
  });

  it("usa la etiqueta personalizada", () => {
    render(<CopiarBoton texto="x" etiqueta="Copiar enlace" />);
    expect(screen.getByText("Copiar enlace")).toBeInTheDocument();
  });

  it("si writeText falla muestra No se pudo copiar", async () => {
    mockClipboard(vi.fn().mockRejectedValue(new Error("denegado")));
    render(<CopiarBoton texto="482915" />);
    await clic();
    expect(screen.getByText("No se pudo copiar")).toBeInTheDocument();
  });

  it("sin navigator.clipboard muestra No se pudo copiar", async () => {
    mockClipboard(undefined);
    render(<CopiarBoton texto="482915" />);
    await clic();
    expect(screen.getByText("No se pudo copiar")).toBeInTheDocument();
  });

  it("limpia el timeout al desmontar", async () => {
    mockClipboard(vi.fn().mockResolvedValue(undefined));
    const { unmount } = render(<CopiarBoton texto="1" />);
    await clic();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
