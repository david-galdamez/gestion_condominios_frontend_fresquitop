import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pedir = vi.fn();
const descargar = vi.fn();
vi.mock("@/lib/exportar-reporte", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/exportar-reporte")>()),
  pedirReporte: (...a: unknown[]) => pedir(...a),
  descargar: (...a: unknown[]) => descargar(...a),
}));

import { ExportarReporte } from "./exportar-reporte";

const PERIODO = { desde: "2026-11-01", hasta: "2026-11-20" };
const montar = (periodo: typeof PERIODO | null = PERIODO) =>
  render(<ExportarReporte periodo={periodo} descripcion="del 01/11/2026 al 20/11/2026" />);

beforeEach(() => {
  pedir.mockReset();
  descargar.mockReset();
});

describe("ExportarReporte", () => {
  it("sin periodo el botón está deshabilitado y dice \"Selecciona un periodo\"", () => {
    montar(null);
    expect(screen.getByRole("button", { name: "Exportar" })).toBeDisabled();
    expect(screen.getByText("Selecciona un periodo")).toBeInTheDocument();
  });

  it("abre el diálogo con el periodo, PDF y Resumida por defecto", async () => {
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole("button", { name: "Exportar" }));
    const dialogo = screen.getByRole("dialog", { name: "Exportar reporte" });
    expect(dialogo).toHaveTextContent("Periodo: del 01/11/2026 al 20/11/2026");
    expect(screen.getByRole("radio", { name: "PDF" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Resumida" })).toBeChecked();
    expect(dialogo).toHaveTextContent("sin unidades ni nombres de residentes");
  });

  it("descarga con las opciones elegidas y cierra el diálogo", async () => {
    const archivo = new Blob(["x"]);
    pedir.mockResolvedValue({ ok: true, archivo, nombre: "reporte-condominio-2026-11-20.xlsx" });
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole("button", { name: "Exportar" }));
    await user.click(screen.getByRole("radio", { name: "Excel" }));
    await user.click(screen.getByRole("radio", { name: "Detallada" }));
    await user.click(screen.getByRole("button", { name: "Descargar" }));

    await waitFor(() => expect(descargar).toHaveBeenCalledWith(archivo, "reporte-condominio-2026-11-20.xlsx"));
    expect(pedir).toHaveBeenCalledWith({ formato: "EXCEL", version: "DETALLADA", ...PERIODO });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("mientras genera deshabilita Descargar y no permite dos descargas", async () => {
    let terminar!: (v: unknown) => void;
    pedir.mockReturnValue(new Promise((r) => (terminar = r)));
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole("button", { name: "Exportar" }));
    await user.click(screen.getByRole("button", { name: "Descargar" }));

    const boton = screen.getByRole("button", { name: "Generando..." });
    expect(boton).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    await user.click(boton);
    expect(pedir).toHaveBeenCalledTimes(1);

    terminar({ ok: true, archivo: new Blob(["x"]), nombre: "r.pdf" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("si falla muestra el error y deja el diálogo abierto para reintentar", async () => {
    pedir.mockResolvedValue({ ok: false, mensaje: "No pudimos generar el archivo. Intenta de nuevo." });
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole("button", { name: "Exportar" }));
    await user.click(screen.getByRole("button", { name: "Descargar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos generar el archivo. Intenta de nuevo.");
    expect(screen.getByRole("button", { name: "Descargar" })).toBeEnabled();
    expect(descargar).not.toHaveBeenCalled();
  });

  it("Cancelar cierra sin descargar", async () => {
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole("button", { name: "Exportar" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(pedir).not.toHaveBeenCalled();
  });
});
