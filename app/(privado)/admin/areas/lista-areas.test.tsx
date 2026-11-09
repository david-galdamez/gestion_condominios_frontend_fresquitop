import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const actualizarEstadoArea = vi.fn();
vi.mock("@/app/actions/areas", () => ({
  actualizarEstadoArea: (...a: unknown[]) => actualizarEstadoArea(...a),
}));

import type { Area } from "@/lib/types/areas";
import { ListaAreas } from "./lista-areas";

const base: Area = {
  id: "ar1",
  nombre: "Asador",
  capacidad: 20,
  horaApertura: "10:00",
  horaCierre: "21:00",
  duracionMaxHoras: 3,
  activa: true,
};
const areas: Area[] = [base, { ...base, id: "ar2", nombre: "Gimnasio", activa: false }];

beforeEach(() => actualizarEstadoArea.mockReset());

describe("ListaAreas", () => {
  it("muestra horario, máximo, estado y las acciones según el estado", () => {
    render(<ListaAreas areas={areas} />);
    expect(screen.getAllByText("10:00–21:00")).toHaveLength(2);
    expect(screen.getAllByText("3 h")).toHaveLength(2);
    expect(screen.getByText("Activa")).toBeInTheDocument();
    expect(screen.getByText("Inactiva")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desactivar Asador" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Activar Gimnasio" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Editar Asador" })).toHaveAttribute(
      "href",
      "/admin/areas/ar1/editar",
    );
  });

  it("desactivar pide confirmación; 'Volver' cierra sin llamar a la acción", async () => {
    const user = userEvent.setup();
    render(<ListaAreas areas={areas} />);
    await user.click(screen.getByRole("button", { name: "Desactivar Asador" }));
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "¿Desactivar “Asador”? No aceptará reservas nuevas; las reservas futuras Confirmadas se mantienen.",
    );
    await user.click(screen.getByRole("button", { name: "Volver" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(actualizarEstadoArea).not.toHaveBeenCalled();
  });

  it("'Sí, desactivar' llama a la acción con activa=false", async () => {
    const user = userEvent.setup();
    actualizarEstadoArea.mockResolvedValue({ ok: true });
    render(<ListaAreas areas={areas} />);
    await user.click(screen.getByRole("button", { name: "Desactivar Asador" }));
    await user.click(screen.getByRole("button", { name: "Sí, desactivar" }));
    await waitFor(() => expect(actualizarEstadoArea).toHaveBeenCalledWith("ar1", false));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("activar no pide confirmación", async () => {
    const user = userEvent.setup();
    actualizarEstadoArea.mockResolvedValue({ ok: true });
    render(<ListaAreas areas={areas} />);
    await user.click(screen.getByRole("button", { name: "Activar Gimnasio" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(actualizarEstadoArea).toHaveBeenCalledWith("ar2", true));
  });

  it("muestra el error de la acción", async () => {
    const user = userEvent.setup();
    actualizarEstadoArea.mockResolvedValue({ ok: false, error: "El área no existe" });
    render(<ListaAreas areas={areas} />);
    await user.click(screen.getByRole("button", { name: "Activar Gimnasio" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("El área no existe");
  });
});
