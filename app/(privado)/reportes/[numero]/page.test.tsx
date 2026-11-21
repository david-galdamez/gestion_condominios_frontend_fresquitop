import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockRequireRol = vi.fn();
vi.mock("@/lib/auth", () => ({
  requireRol: (...roles: string[]) => mockRequireRol(...roles),
}));

const mockGetReporte = vi.fn();
vi.mock("@/lib/reportes", () => ({
  getReporte: (numero: string) => mockGetReporte(numero),
}));

import { formatFechaHora } from "@/lib/reportes-ui";
import ReporteDetallePage from "./page";

beforeEach(() => {
  mockRequireRol.mockReset();
  mockGetReporte.mockReset();
  mockRequireRol.mockResolvedValue({
    id: "res-1",
    email: "ana@condominio.com",
    nombre: "Ana Gómez",
    rol: "RESIDENTE",
  });
});

describe("ReporteDetallePage — historial de estados del residente (FE-24.2)", () => {
  it("renderiza el historial cronológico con estados, fechas y comentarios, muestra la nota de cierre y no incluye botones para reabrir", async () => {
    const fechaAbierto = "2026-11-18T14:00:00.000Z";
    const fechaProceso = "2026-11-19T16:15:00.000Z";
    const fechaResuelto = "2026-11-20T18:30:00.000Z";
    const comentarioCierre =
      "Se reemplazó el empaque de la tubería principal y se verificó que no hay fugas.";

    mockGetReporte.mockResolvedValue({
      status: "ok",
      data: {
        id: "22222222-2222-4222-8222-222222222222",
        numero: "REP-000123",
        titulo: "Fuga de agua en pasillo",
        categoria: "FUGA",
        ubicacion: "Torre A",
        descripcion: "Hay una fuga constante frente al ascensor.",
        estado: "RESUELTO",
        fotos: [],
        creadoEn: fechaAbierto,
        resueltoEn: fechaResuelto,
        comentarioCierre,
        historial: [
          {
            id: "h-1",
            estado: "ABIERTO",
            fecha: fechaAbierto,
            comentario: null,
          },
          {
            id: "h-2",
            estado: "EN_PROCESO",
            fecha: fechaProceso,
            comentario: "Prioridad: ALTA · Responsable: Fontanería López",
          },
          {
            id: "h-3",
            estado: "RESUELTO",
            fecha: fechaResuelto,
            comentario: comentarioCierre,
          },
        ],
      },
    });

    const ui = await ReporteDetallePage({
      params: Promise.resolve({ numero: "REP-000123" }),
      searchParams: Promise.resolve({}),
    });
    render(ui);

    expect(mockRequireRol).toHaveBeenCalledWith("RESIDENTE");
    expect(screen.getByText("Historial de estados")).toBeInTheDocument();

    // Estados y fechas formateadas en el historial
    expect(screen.getByText("Abierto")).toBeInTheDocument();
    expect(screen.getByText("En proceso")).toBeInTheDocument();
    expect(screen.getAllByText("Resuelto").length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getAllByText(formatFechaHora(fechaAbierto)).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(formatFechaHora(fechaProceso)),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(formatFechaHora(fechaResuelto)).length,
    ).toBeGreaterThanOrEqual(1);

    // Comentarios del historial
    expect(
      screen.getByText("Prioridad: ALTA · Responsable: Fontanería López"),
    ).toBeInTheDocument();
    expect(screen.getByText("Comentario de resolución")).toBeInTheDocument();
    expect(screen.getByText(comentarioCierre)).toBeInTheDocument();

    // Nota informativa de cierre irreversible
    expect(screen.getByRole("note")).toHaveTextContent(
      "Este reporte está resuelto y no se puede reabrir; si el problema persiste, crea un nuevo reporte.",
    );

    // Ningún botón ni control para cambiar estado o reabrir
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /reabrir/i })).not.toBeInTheDocument();
  });

  it("no muestra la nota de reporte resuelto cuando el reporte sigue en proceso", async () => {
    mockGetReporte.mockResolvedValue({
      status: "ok",
      data: {
        id: "22222222-2222-4222-8222-222222222222",
        numero: "REP-000124",
        titulo: "Luminaria apagada",
        categoria: "LUMINARIA",
        ubicacion: "Lobby",
        descripcion: "La luz principal del lobby no enciende.",
        estado: "EN_PROCESO",
        fotos: [],
        creadoEn: "2026-11-18T14:00:00.000Z",
        resueltoEn: null,
        comentarioCierre: null,
        historial: [
          {
            id: "h-1",
            estado: "ABIERTO",
            fecha: "2026-11-18T14:00:00.000Z",
            comentario: null,
          },
          {
            id: "h-2",
            estado: "EN_PROCESO",
            fecha: "2026-11-19T09:00:00.000Z",
            comentario: "Prioridad: MEDIA · Responsable: Eléctrica Central",
          },
        ],
      },
    });

    const ui = await ReporteDetallePage({
      params: Promise.resolve({ numero: "REP-000124" }),
      searchParams: Promise.resolve({}),
    });
    render(ui);

    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    expect(
      screen.getByText("Prioridad: MEDIA · Responsable: Eléctrica Central"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});