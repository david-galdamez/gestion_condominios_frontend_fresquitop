import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const mockAsignarReporteAction = vi.fn();
vi.mock("@/app/actions/reportes", () => ({
  asignarReporteAction: (...args: unknown[]) =>
    mockAsignarReporteAction(...args),
}));

import { AsignacionReporteForm } from "./asignacion-form";

const REPORTE_ID = "22222222-2222-4222-8222-222222222222";

beforeEach(() => {
  refresh.mockReset();
  mockAsignarReporteAction.mockReset();
});

describe("AsignacionReporteForm (H06)", () => {
  it("mantiene el botón 'Guardar asignación' deshabilitado si falta prioridad o responsable", async () => {
    const user = userEvent.setup();
    render(
      <AsignacionReporteForm
        reporteId={REPORTE_ID}
        estadoInicial="ABIERTO"
        prioridadInicial={null}
        responsableInicial={null}
      />,
    );

    const boton = screen.getByRole("button", { name: "Guardar asignación" });
    expect(boton).toBeDisabled();

    // Solo prioridad -> sigue deshabilitado
    await user.selectOptions(screen.getByLabelText(/Asignar Prioridad/i), "ALTA");
    expect(boton).toBeDisabled();

    // Se completa responsable -> se habilita
    await user.type(
      screen.getByLabelText(/Asignar Responsable/i),
      "Fontanería López",
    );
    expect(boton).toBeEnabled();

    // Se borra prioridad -> vuelve a deshabilitarse
    await user.selectOptions(screen.getByLabelText(/Asignar Prioridad/i), "");
    expect(boton).toBeDisabled();
  });

  it("muestra 'Asigna prioridad y responsable juntos' si se intenta enviar el formulario con un solo campo", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AsignacionReporteForm
        reporteId={REPORTE_ID}
        estadoInicial="ABIERTO"
        prioridadInicial={null}
        responsableInicial={null}
      />,
    );

    await user.selectOptions(screen.getByLabelText(/Asignar Prioridad/i), "ALTA");
    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Asigna prioridad y responsable juntos",
    );
    expect(mockAsignarReporteAction).not.toHaveBeenCalled();
  });

  it("muestra 'Asignación guardada' y llama router.refresh() al guardar con éxito", async () => {
    const user = userEvent.setup();
    mockAsignarReporteAction.mockResolvedValue({
      status: "ok",
      mensaje: "Asignación guardada",
      asignacion: {
        id: REPORTE_ID,
        numero: "REP-000123",
        estado: "EN_PROCESO",
        prioridad: "ALTA",
        responsable: "Fontanería López",
      },
    });

    render(
      <AsignacionReporteForm
        reporteId={REPORTE_ID}
        estadoInicial="ABIERTO"
        prioridadInicial={null}
        responsableInicial={null}
      />,
    );

    await user.selectOptions(screen.getByLabelText(/Asignar Prioridad/i), "ALTA");
    await user.type(
      screen.getByLabelText(/Asignar Responsable/i),
      "Fontanería López",
    );
    await user.click(screen.getByRole("button", { name: "Guardar asignación" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("Asignación guardada");
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("muestra 'No pudimos guardar. Intenta de nuevo.' ante fallo del servidor", async () => {
    const user = userEvent.setup();
    mockAsignarReporteAction.mockResolvedValue({
      status: "error",
      mensaje: "No pudimos guardar. Intenta de nuevo.",
    });

    render(
      <AsignacionReporteForm
        reporteId={REPORTE_ID}
        estadoInicial="EN_PROCESO"
        prioridadInicial="MEDIA"
        responsableInicial="Soporte Eléctrico"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Guardar asignación" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "No pudimos guardar. Intenta de nuevo.",
      );
    });
  });

  it("en estado RESUELTO muestra prioridad y responsable en modo solo lectura sin botón de guardar", () => {
    render(
      <AsignacionReporteForm
        reporteId={REPORTE_ID}
        estadoInicial="RESUELTO"
        prioridadInicial="ALTA"
        responsableInicial="Fontanería López"
      />,
    );

    expect(screen.getByText("Alta")).toBeInTheDocument();
    expect(screen.getByText("Fontanería López")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Guardar asignación" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});