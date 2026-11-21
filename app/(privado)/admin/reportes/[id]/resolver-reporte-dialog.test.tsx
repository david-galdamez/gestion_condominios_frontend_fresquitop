import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const mockResolverReporteAction = vi.fn();
vi.mock("@/app/actions/reportes", () => ({
  resolverReporteAction: (...args: unknown[]) =>
    mockResolverReporteAction(...args),
}));

import { ResolverReporteDialog } from "./resolver-reporte-dialog";

const REPORTE_ID = "22222222-2222-4222-8222-222222222222";
const NUMERO = "REP-000123";

beforeEach(() => {
  refresh.mockReset();
  mockResolverReporteAction.mockReset();
});

describe("ResolverReporteDialog (FE-24.1)", () => {
  it("solo renderiza el botón 'Marcar como Resuelto' cuando el estado es EN_PROCESO", () => {
    const { rerender } = render(
      <ResolverReporteDialog
        reporteId={REPORTE_ID}
        numero={NUMERO}
        estadoInicial="ABIERTO"
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Marcar como Resuelto" }),
    ).not.toBeInTheDocument();

    rerender(
      <ResolverReporteDialog
        reporteId={REPORTE_ID}
        numero={NUMERO}
        estadoInicial="RESUELTO"
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Marcar como Resuelto" }),
    ).not.toBeInTheDocument();

    rerender(
      <ResolverReporteDialog
        reporteId={REPORTE_ID}
        numero={NUMERO}
        estadoInicial="EN_PROCESO"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Marcar como Resuelto" }),
    ).toBeInTheDocument();
  });

  it("muestra la advertencia de irreversibilidad, contador y mantiene 'Confirmar' deshabilitado fuera de 10-300 caracteres", async () => {
    const user = userEvent.setup();
    render(
      <ResolverReporteDialog
        reporteId={REPORTE_ID}
        numero={NUMERO}
        estadoInicial="EN_PROCESO"
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Marcar como Resuelto" }),
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(
      `¿Marcar ${NUMERO} como Resuelto? Esta acción no se puede deshacer.`,
    );
    expect(screen.getByText("0 / 300")).toBeInTheDocument();

    const textarea = screen.getByLabelText(/Comentario de cierre/i);
    const botonConfirmar = screen.getByRole("button", { name: "Confirmar" });

    // Vacío -> deshabilitado
    expect(botonConfirmar).toBeDisabled();

    // 9 caracteres -> deshabilitado
    await user.type(textarea, "123456789");
    expect(screen.getByText("9 / 300")).toBeInTheDocument();
    expect(botonConfirmar).toBeDisabled();

    // 10 caracteres -> habilitado
    await user.type(textarea, "0");
    expect(screen.getByText("10 / 300")).toBeInTheDocument();
    expect(botonConfirmar).toBeEnabled();

    // 301 caracteres -> vuelve a deshabilitarse
    fireEvent.change(textarea, { target: { value: "a".repeat(301) } });
    expect(screen.getByText("301 / 300")).toBeInTheDocument();
    expect(botonConfirmar).toBeDisabled();

    // Cancelar cierra el diálogo sin llamar la acción
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockResolverReporteAction).not.toHaveBeenCalled();
  });

  it("al confirmar con éxito cierra el modal, muestra 'Reporte marcado como Resuelto' y llama router.refresh()", async () => {
    const user = userEvent.setup();
    const comentario =
      "Se reemplazó el empaque de la tubería y se verificó que no existen fugas.";

    mockResolverReporteAction.mockResolvedValue({
      status: "ok",
      mensaje: "Reporte marcado como Resuelto",
      resolucion: {
        id: REPORTE_ID,
        numero: NUMERO,
        estado: "RESUELTO",
        resueltoEn: "2026-11-20T16:30:00.000Z",
      },
    });

    render(
      <ResolverReporteDialog
        reporteId={REPORTE_ID}
        numero={NUMERO}
        estadoInicial="EN_PROCESO"
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Marcar como Resuelto" }),
    );
    fireEvent.change(screen.getByLabelText(/Comentario de cierre/i), {
      target: { value: comentario },
    });
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        "Reporte marcado como Resuelto",
      );
    });

    expect(mockResolverReporteAction).toHaveBeenCalledWith(
      REPORTE_ID,
      comentario,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Marcar como Resuelto" }),
    ).not.toBeInTheDocument();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("muestra 'Solo se pueden resolver reportes En proceso' ante error 409", async () => {
    const user = userEvent.setup();
    mockResolverReporteAction.mockResolvedValue({
      status: "error",
      mensaje: "Solo se pueden resolver reportes En proceso",
    });

    render(
      <ResolverReporteDialog
        reporteId={REPORTE_ID}
        numero={NUMERO}
        estadoInicial="EN_PROCESO"
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Marcar como Resuelto" }),
    );
    fireEvent.change(screen.getByLabelText(/Comentario de cierre/i), {
      target: { value: "Comentario válido para probar el conflicto 409." },
    });
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Solo se pueden resolver reportes En proceso",
      );
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("muestra 'No pudimos actualizar el reporte. Intenta de nuevo.' ante fallo de red o servidor", async () => {
    const user = userEvent.setup();
    mockResolverReporteAction.mockResolvedValue({
      status: "error",
      mensaje: "No pudimos actualizar el reporte. Intenta de nuevo.",
    });

    render(
      <ResolverReporteDialog
        reporteId={REPORTE_ID}
        numero={NUMERO}
        estadoInicial="EN_PROCESO"
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Marcar como Resuelto" }),
    );
    fireEvent.change(screen.getByLabelText(/Comentario de cierre/i), {
      target: { value: "Comentario válido para probar el error genérico." },
    });
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "No pudimos actualizar el reporte. Intenta de nuevo.",
      );
    });
  });
});