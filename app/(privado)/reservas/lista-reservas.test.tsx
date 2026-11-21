import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cancelar = vi.fn();
vi.mock("@/app/actions/reservas", () => ({
  cancelarReservaAction: (...a: unknown[]) => cancelar(...a),
}));

import { ListaReservas } from "./lista-reservas";

const base = {
  area: "Alberca", fecha: "2026-11-10", horaInicio: "09:00", horaFin: "11:00", asistentes: 12,
};
const reservas = [
  { ...base, id: "r1", codigo: "RES-000001", estado: "CONFIRMADA" as const },
  { ...base, id: "r2", codigo: "RES-000002", estado: "CANCELADA" as const },
];

beforeEach(() => cancelar.mockReset());

describe("ListaReservas", () => {
  it("muestra los datos y solo permite cancelar las confirmadas", () => {
    render(<ListaReservas reservas={reservas} />);
    expect(screen.getByText("RES-000001")).toBeInTheDocument();
    expect(screen.getAllByText("10/11/2026")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Cancelar" })).toHaveLength(1);
  });

  it("confirma antes de cancelar y llama a la acción", async () => {
    cancelar.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<ListaReservas reservas={reservas} />);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("RES-000001");
    await user.click(screen.getByRole("button", { name: "Sí, cancelar" }));
    await waitFor(() => expect(cancelar).toHaveBeenCalledWith("r1"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("\"No\" cierra el diálogo sin cancelar", async () => {
    const user = userEvent.setup();
    render(<ListaReservas reservas={reservas} />);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.click(screen.getByRole("button", { name: "No" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(cancelar).not.toHaveBeenCalled();
  });

  it("con menos de 24 horas muestra el motivo", async () => {
    cancelar.mockResolvedValue({ ok: false, error: "Ya no puedes cancelar esta reserva" });
    const user = userEvent.setup();
    render(<ListaReservas reservas={reservas} />);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.click(screen.getByRole("button", { name: "Sí, cancelar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Ya no puedes cancelar esta reserva");
  });
});
