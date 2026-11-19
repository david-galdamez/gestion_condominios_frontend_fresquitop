import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const accion = vi.fn();
vi.mock("@/app/actions/paquetes", () => ({
  entregarPaqueteAction: (...a: unknown[]) => accion(...a),
}));

import { EntregarPaquete } from "./entregar-paquete";

const paquete = {
  id: "p1",
  codigoPaquete: "PAQ-000123",
  unidad: "A-101",
  destinatario: "Carlos Pérez",
};

beforeEach(() => accion.mockReset());

async function abrir() {
  const user = userEvent.setup();
  render(<EntregarPaquete paquete={paquete} />);
  await user.click(screen.getByRole("button", { name: "Entregar PAQ-000123" }));
  return user;
}

describe("EntregarPaquete", () => {
  it("abre el diálogo con el paquete y cierra con Cancelar", async () => {
    const user = await abrir();
    expect(screen.getByRole("dialog")).toHaveTextContent("Entregar paquete PAQ-000123");
    expect(screen.getByRole("dialog")).toHaveTextContent("Unidad A-101");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Confirmar está deshabilitado hasta completar los campos", async () => {
    const user = await abrir();
    const confirmar = screen.getByRole("button", { name: "Confirmar entrega" });
    expect(confirmar).toBeDisabled();
    await user.type(screen.getByLabelText("Código de retiro"), "48291");
    await user.type(screen.getByLabelText("Recibe"), "Carlos");
    expect(confirmar).toBeDisabled();
    await user.type(screen.getByLabelText("Código de retiro"), "5");
    expect(confirmar).toBeEnabled();
  });

  it("el código solo admite dígitos y hasta 6", async () => {
    const user = await abrir();
    await user.type(screen.getByLabelText("Código de retiro"), "48a2-91567");
    expect(screen.getByLabelText("Código de retiro")).toHaveValue("482915");
  });

  it("muestra el error al salir de un campo con menos de 6 dígitos", async () => {
    const user = await abrir();
    await user.type(screen.getByLabelText("Código de retiro"), "123");
    await user.tab();
    expect(screen.getByText("El código de retiro debe tener 6 dígitos")).toBeInTheDocument();
  });

  it("envía los datos a la acción con el id del paquete", async () => {
    accion.mockResolvedValue({ status: "idle" });
    const user = await abrir();
    await user.type(screen.getByLabelText("Código de retiro"), "482915");
    await user.type(screen.getByLabelText("Recibe"), "Carlos Pérez");
    await user.click(screen.getByRole("button", { name: "Confirmar entrega" }));
    expect(accion).toHaveBeenCalledTimes(1);
    const [id, , datos] = accion.mock.calls[0];
    expect(id).toBe("p1");
    expect(datos.get("codigoRetiro")).toBe("482915");
    expect(datos.get("recibidoPor")).toBe("Carlos Pérez");
  });

  it("código incorrecto: muestra el error y conserva lo escrito", async () => {
    accion.mockResolvedValue({
      status: "error",
      errores: { codigoRetiro: "Código de retiro incorrecto" },
    });
    const user = await abrir();
    await user.type(screen.getByLabelText("Código de retiro"), "000000");
    await user.type(screen.getByLabelText("Recibe"), "Carlos Pérez");
    await user.click(screen.getByRole("button", { name: "Confirmar entrega" }));
    expect(await screen.findByText("Código de retiro incorrecto")).toBeInTheDocument();
    expect(screen.getByLabelText("Código de retiro")).toHaveValue("000000");
    expect(screen.getByLabelText("Recibe")).toHaveValue("Carlos Pérez");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("ya entregado: muestra el mensaje arriba del formulario", async () => {
    accion.mockResolvedValue({ status: "error", mensajes: ["Este paquete ya fue entregado"] });
    const user = await abrir();
    await user.type(screen.getByLabelText("Código de retiro"), "482915");
    await user.type(screen.getByLabelText("Recibe"), "Carlos Pérez");
    await user.click(screen.getByRole("button", { name: "Confirmar entrega" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Este paquete ya fue entregado");
  });
});
