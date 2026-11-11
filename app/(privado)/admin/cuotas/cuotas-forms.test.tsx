import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const guardarConfiguracionAction = vi.fn();
const generarCuotasAction = vi.fn();
vi.mock("@/app/actions/cuotas", () => ({
  guardarConfiguracionAction: (...a: unknown[]) => guardarConfiguracionAction(...a),
  generarCuotasAction: (...a: unknown[]) => generarCuotasAction(...a),
}));

import { ConfiguracionForm } from "./configuracion-form";
import { GenerarForm } from "./generar-form";

beforeEach(() => {
  guardarConfiguracionAction.mockReset();
  generarCuotasAction.mockReset();
});

describe("ConfiguracionForm", () => {
  it("precarga la configuración vigente y la describe", () => {
    render(
      <ConfiguracionForm
        configuracion={{ montoMensual: 45, diaVencimiento: 10, vigenteDesde: "2026-11-02" }}
      />,
    );
    expect(screen.getByLabelText("Monto mensual (USD)")).toHaveValue("45.00");
    expect(screen.getByLabelText("Día de vencimiento (1 a 28)")).toHaveValue(10);
    expect(screen.getByText(/Vigente desde el 02\/11\/2026/)).toBeInTheDocument();
  });

  it("sin configuración muestra los campos vacíos", () => {
    render(<ConfiguracionForm configuracion={null} />);
    expect(screen.getByText(/Todavía no hay una configuración guardada/)).toBeInTheDocument();
    expect(screen.getByLabelText("Monto mensual (USD)")).toHaveValue("");
  });

  it("día 29: muestra el error y no llama a la acción", async () => {
    const user = userEvent.setup();
    render(<ConfiguracionForm configuracion={null} />);
    await user.type(screen.getByLabelText("Monto mensual (USD)"), "45");
    await user.type(screen.getByLabelText("Día de vencimiento (1 a 28)"), "29");
    await user.click(screen.getByRole("button", { name: "Guardar configuración" }));
    expect(screen.getByLabelText("Día de vencimiento (1 a 28)")).toHaveAccessibleDescription(
      "El día de vencimiento debe estar entre 1 y 28",
    );
    expect(guardarConfiguracionAction).not.toHaveBeenCalled();
  });

  it("datos válidos llaman a la acción y muestran la confirmación", async () => {
    guardarConfiguracionAction.mockResolvedValue({
      status: "ok",
      configuracion: { montoMensual: 50, diaVencimiento: 5, vigenteDesde: "2026-11-11" },
    });
    const user = userEvent.setup();
    render(<ConfiguracionForm configuracion={null} />);
    await user.type(screen.getByLabelText("Monto mensual (USD)"), "50");
    await user.type(screen.getByLabelText("Día de vencimiento (1 a 28)"), "5");
    await user.click(screen.getByRole("button", { name: "Guardar configuración" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Configuración guardada.");
    expect(guardarConfiguracionAction).toHaveBeenCalledTimes(1);
  });
});

describe("GenerarForm", () => {
  it("ofrece los periodos con nombre de mes", () => {
    render(<GenerarForm periodos={["2026-11", "2026-12"]} habilitado />);
    const opciones = screen.getByLabelText("Periodo").querySelectorAll("option");
    expect(Array.from(opciones).map((o) => o.textContent)).toEqual([
      "Noviembre 2026",
      "Diciembre 2026",
    ]);
  });

  it("deshabilitado sin configuración", () => {
    render(<GenerarForm periodos={["2026-11"]} habilitado={false} />);
    expect(screen.getByRole("button", { name: "Generar cuotas" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Guarda primero la configuración");
  });

  it("muestra el resultado de la generación", async () => {
    generarCuotasAction.mockResolvedValue({
      status: "ok",
      mensajes: ["No se crearon cuotas nuevas para Noviembre 2026.", "Se omitieron 3 unidades que ya tenían cuota"],
    });
    const user = userEvent.setup();
    render(<GenerarForm periodos={["2026-11"]} habilitado />);
    await user.click(screen.getByRole("button", { name: "Generar cuotas" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Se omitieron 3 unidades que ya tenían cuota",
    );
    const fd = generarCuotasAction.mock.calls[0][1] as FormData;
    expect(fd.get("periodo")).toBe("2026-11");
  });
});
