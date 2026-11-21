import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const guardarArea = vi.fn();
vi.mock("@/app/actions/areas", () => ({
  guardarArea: (...a: unknown[]) => guardarArea(...a),
}));

import type { Area } from "@/lib/types/areas";
import { AreaForm } from "./area-form";

const area: Area = {
  id: "ar1",
  nombre: "Alberca",
  capacidad: 30,
  horaApertura: "07:00",
  horaCierre: "19:00",
  duracionMaxHoras: 2,
  activa: true,
};

beforeEach(() => guardarArea.mockReset());

const elegir = (label: string, v: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value: v } });

describe("AreaForm", () => {
  it("alta: valores por defecto (duración 3) y sin id oculto", () => {
    const { container } = render(<AreaForm />);
    expect(screen.getByLabelText("Nombre")).toHaveValue("");
    expect(screen.getByLabelText("Duración máxima por reserva")).toHaveValue("3");
    expect(container.querySelector('input[name="id"]')).toBeNull();
  });

  it("edición: precarga los datos y manda el id", () => {
    const { container } = render(<AreaForm area={area} />);
    expect(screen.getByLabelText("Nombre")).toHaveValue("Alberca");
    expect(screen.getByLabelText("Capacidad (personas)")).toHaveValue(30);
    expect(screen.getByLabelText("Hora de apertura")).toHaveValue("07:00");
    expect(screen.getByLabelText("Hora de cierre")).toHaveValue("19:00");
    expect(container.querySelector('input[name="id"]')).toHaveValue("ar1");
  });

  it("las horas solo ofrecen horas en punto (24 opciones)", () => {
    render(<AreaForm />);
    const opciones = screen.getByLabelText("Hora de apertura").querySelectorAll("option");
    expect(opciones).toHaveLength(24);
    expect(Array.from(opciones).every((o) => o.value.endsWith(":00"))).toBe(true);
  });

  it("envío vacío muestra errores por campo y no llama a la acción", async () => {
    const user = userEvent.setup();
    render(<AreaForm />);
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(screen.getByLabelText("Nombre")).toHaveAccessibleDescription(
      "El nombre debe tener entre 3 y 40 caracteres",
    );
    expect(screen.getByLabelText("Capacidad (personas)")).toHaveAccessibleDescription(
      "La capacidad debe estar entre 1 y 200 personas",
    );
    expect(guardarArea).not.toHaveBeenCalled();
  });

  it("cierre igual o anterior a la apertura avisa al cambiar la hora", () => {
    render(<AreaForm />);
    elegir("Hora de cierre", "06:00");
    expect(screen.getByLabelText("Hora de cierre")).toHaveAccessibleDescription(
      "La hora de cierre debe ser posterior a la de apertura",
    );
    elegir("Hora de cierre", "21:00");
    expect(
      screen.queryByText("La hora de cierre debe ser posterior a la de apertura"),
    ).not.toBeInTheDocument();
  });

  it("blur valida la capacidad", async () => {
    const user = userEvent.setup();
    render(<AreaForm />);
    await user.type(screen.getByLabelText("Capacidad (personas)"), "201");
    await user.tab();
    expect(
      screen.getByText("La capacidad debe estar entre 1 y 200 personas"),
    ).toBeInTheDocument();
  });

  it("el error de nombre repetido del servidor aparece bajo el campo y conserva lo escrito", async () => {
    const user = userEvent.setup();
    guardarArea.mockResolvedValue({
      status: "error",
      errores: { nombre: "Ya existe un área con ese nombre" },
    });
    render(<AreaForm />);
    await user.type(screen.getByLabelText("Nombre"), "Alberca");
    await user.type(screen.getByLabelText("Capacidad (personas)"), "30");
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Ya existe un área con ese nombre")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toHaveValue("Alberca");
    expect(guardarArea).toHaveBeenCalledTimes(1);
  });

  it("los errores generales del servidor salen arriba", async () => {
    const user = userEvent.setup();
    guardarArea.mockResolvedValue({
      status: "error",
      mensajes: ["No pudimos guardar el área. Intenta de nuevo."],
    });
    render(<AreaForm area={area} />);
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No pudimos guardar el área. Intenta de nuevo.",
    );
  });

  it("Cancelar vuelve a la lista", () => {
    render(<AreaForm />);
    expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute("href", "/admin/areas");
  });
});
