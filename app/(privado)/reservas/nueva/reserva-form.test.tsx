import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
const otra = { ...area, id: "a2", nombre: "Salón", horaApertura: "10:00", horaCierre: "14:00" };
const ahora = { hoy: "2026-11-10", hora: 9 };

beforeEach(() => accion.mockReset());

const setFecha = (v: string) =>
  fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: v } });

describe("ReservaForm", () => {
  it("las horas dependen del área y están deshabilitadas sin área", async () => {
    const user = userEvent.setup();
    render(<ReservaForm areas={[area, otra]} ahora={ahora} />);
    expect(screen.getByLabelText("Hora de inicio")).toBeDisabled();
    await user.selectOptions(screen.getByLabelText("Área"), "a1");
    const inicio = screen.getByLabelText("Hora de inicio") as HTMLSelectElement;
    expect([...inicio.options].map((o) => o.value)).toEqual([
      "", "08:00", "09:00", "10:00", "11:00",
    ]);
    expect(screen.getByText(/Horario 08:00 – 12:00/)).toBeInTheDocument();
  });

  it("con una sola área queda seleccionada", () => {
    render(<ReservaForm areas={[area]} ahora={ahora} />);
    expect(screen.getByLabelText("Área")).toHaveValue("a1");
  });

  it("muestra errores del cliente y no envía", async () => {
    const user = userEvent.setup();
    render(<ReservaForm areas={[area]} ahora={ahora} />);
    await user.click(screen.getByRole("button", { name: "Reservar" }));
    expect(screen.getByText("Elige una fecha")).toBeInTheDocument();
    expect(screen.getByText("Elige la hora de inicio")).toBeInTheDocument();
    expect(screen.getByText("Indica cuántas personas asistirán (1 o más)")).toBeInTheDocument();
    expect(accion).not.toHaveBeenCalled();
  });

  it("valida duración máxima y capacidad", async () => {
    const user = userEvent.setup();
    render(<ReservaForm areas={[area]} ahora={ahora} />);
    setFecha("2026-11-12");
    await user.selectOptions(screen.getByLabelText("Hora de inicio"), "08:00");
    await user.selectOptions(screen.getByLabelText("Hora de fin"), "12:00");
    await user.type(screen.getByLabelText("Número de asistentes"), "25");
    await user.click(screen.getByRole("button", { name: "Reservar" }));
    expect(screen.getByText("Supera la duración máxima de 2 horas")).toBeInTheDocument();
    expect(screen.getByText("Supera la capacidad de 20 personas")).toBeInTheDocument();
    expect(accion).not.toHaveBeenCalled();
  });

  it("envía y muestra el código de la reserva confirmada", async () => {
    accion.mockResolvedValue({
      status: "ok",
      reserva: {
        id: "r1", codigo: "RES-000123", area: "Alberca", fecha: "2026-11-12",
        horaInicio: "09:00", horaFin: "11:00", asistentes: 12, estado: "CONFIRMADA",
      },
    });
    const user = userEvent.setup();
    render(<ReservaForm areas={[area]} ahora={ahora} />);
    setFecha("2026-11-12");
    await user.selectOptions(screen.getByLabelText("Hora de inicio"), "09:00");
    await user.selectOptions(screen.getByLabelText("Hora de fin"), "11:00");
    await user.type(screen.getByLabelText("Número de asistentes"), "12");
    await user.click(screen.getByRole("button", { name: "Reservar" }));
    expect(await screen.findByTestId("codigo")).toHaveTextContent("RES-000123");
    expect(accion).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Hacer otra reserva" }));
    expect(screen.getByLabelText("Fecha")).toHaveValue("");
  });

  it("muestra el error del servidor y conserva lo escrito", async () => {
    accion.mockResolvedValue({
      status: "error",
      mensajes: ["Ese horario ya está reservado"],
    });
    const user = userEvent.setup();
    render(<ReservaForm areas={[area]} ahora={ahora} />);
    setFecha("2026-11-12");
    await user.selectOptions(screen.getByLabelText("Hora de inicio"), "09:00");
    await user.selectOptions(screen.getByLabelText("Hora de fin"), "11:00");
    await user.type(screen.getByLabelText("Número de asistentes"), "12");
    await user.click(screen.getByRole("button", { name: "Reservar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Ese horario ya está reservado");
    expect(screen.getByLabelText("Número de asistentes")).toHaveValue(12);
    expect(screen.getByLabelText("Hora de inicio")).toHaveValue("09:00");
  });
});
