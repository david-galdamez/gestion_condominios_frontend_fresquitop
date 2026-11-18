import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cancelarVisita = vi.fn();
vi.mock("@/app/actions/visitas", () => ({
  cancelarVisita: (...a: unknown[]) => cancelarVisita(...a),
}));

import type { Autorizacion } from "@/lib/types/visitas";
import { ListaVisitas } from "./lista-visitas";

const base: Autorizacion = {
  id: "a1",
  codigo: "482915",
  nombre: "Ana Pérez",
  tipoDocumento: "DUI",
  numeroDocumento: "12345678-9",
  placa: null,
  fechaVisita: "2026-11-10",
  horaEstimada: "10:00",
  estado: "VIGENTE",
  unidad: { id: "u1", codigo: "A-101" },
};
const datos: Autorizacion[] = [
  base,
  { ...base, id: "a2", nombre: "Luis", estado: "USADA", placa: "P123" },
  { ...base, id: "a3", nombre: "Marta", estado: "CANCELADA" },
  { ...base, id: "a4", nombre: "Pedro", estado: "VENCIDA" },
];

beforeEach(() => cancelarVisita.mockReset());

describe("ListaVisitas", () => {
  it("muestra fecha, placa o guion y Cancelar solo en Vigentes", () => {
    render(<ListaVisitas autorizaciones={datos} />);
    expect(screen.getAllByText(/10\/11\/2026 10:00/)).toHaveLength(4);
    expect(screen.getByText("P123")).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: "Cancelar" })).toHaveLength(1);
  });

  it("pide confirmación; 'No' cierra sin llamar a la acción", async () => {
    const user = userEvent.setup();
    render(<ListaVisitas autorizaciones={datos} />);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "¿Cancelar la autorización de Ana Pérez para el 10/11/2026? El código dejará de funcionar.",
    );
    await user.click(screen.getByRole("button", { name: "No" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(cancelarVisita).not.toHaveBeenCalled();
  });

  it("'Sí, cancelar' llama a la acción con el id", async () => {
    const user = userEvent.setup();
    cancelarVisita.mockResolvedValue({ ok: true });
    render(<ListaVisitas autorizaciones={datos} />);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.click(screen.getByRole("button", { name: "Sí, cancelar" }));
    await waitFor(() => expect(cancelarVisita).toHaveBeenCalledWith("a1"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("409 muestra el mensaje", async () => {
    const user = userEvent.setup();
    cancelarVisita.mockResolvedValue({
      ok: false,
      error: "Esta autorización ya no se puede cancelar",
    });
    render(<ListaVisitas autorizaciones={datos} />);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.click(screen.getByRole("button", { name: "Sí, cancelar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Esta autorización ya no se puede cancelar",
    );
  });

  it("Editar solo en Vigentes y apunta a /visitas/{id}/editar", () => {
    render(<ListaVisitas autorizaciones={datos} />);
    const links = screen.getAllByRole("link", { name: "Editar" });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/visitas/a1/editar");
  });
});
