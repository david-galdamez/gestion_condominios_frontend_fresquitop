import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

// FE-23.2: el formulario de H04 abre con el bloque elegido en la disponibilidad.
const accion = vi.fn();
vi.mock("@/app/actions/reservas", () => ({
  crearReservaAction: (...a: unknown[]) => accion(...a),
}));

import { ReservaForm } from "./reserva-form";

const area = {
  id: "a1",
  nombre: "Alberca",
  capacidad: 20,
  horaApertura: "08:00",
  horaCierre: "12:00",
  duracionMaxHoras: 2,
  activa: true,
};
const otra = { ...area, id: "a2", nombre: "Salón" };
const ahora = { hoy: "2026-11-10", hora: 9 };

describe("ReservaForm con datos de la disponibilidad", () => {
  it("abre con área, fecha y hora de inicio ya llenos", () => {
    render(
      <ReservaForm
        areas={[area, otra]}
        ahora={ahora}
        prellenado={{ areaId: "a2", fecha: "2026-11-12", horaInicio: "10:00" }}
      />,
    );
    expect(screen.getByLabelText("Área")).toHaveValue("a2");
    expect(screen.getByLabelText("Fecha")).toHaveValue("2026-11-12");
    expect(screen.getByLabelText("Hora de inicio")).toHaveValue("10:00");
    expect(screen.getByLabelText("Hora de fin")).toHaveValue("");
  });

  it("sin datos iniciales se comporta como antes", () => {
    render(<ReservaForm areas={[area, otra]} ahora={ahora} />);
    expect(screen.getByLabelText("Área")).toHaveValue("");
    expect(screen.getByLabelText("Fecha")).toHaveValue("");
  });

  it("los datos iniciales siguen siendo editables", async () => {
    const user = userEvent.setup();
    render(
      <ReservaForm areas={[area, otra]} ahora={ahora} prellenado={{ areaId: "a1", horaInicio: "09:00" }} />,
    );
    await user.selectOptions(screen.getByLabelText("Hora de inicio"), "10:00");
    expect(screen.getByLabelText("Hora de inicio")).toHaveValue("10:00");
    // Cambiar de área limpia las horas, igual que en H04.
    await user.selectOptions(screen.getByLabelText("Área"), "a2");
    expect(screen.getByLabelText("Hora de inicio")).toHaveValue("");
  });
});
