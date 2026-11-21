import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockRequireRol = vi.fn();
vi.mock("@/lib/auth", () => ({
  requireRol: (...roles: string[]) => mockRequireRol(...roles),
}));

const mockGetAdminReportes = vi.fn();
vi.mock("@/lib/reportes", () => ({
  getAdminReportes: (filtros: unknown) => mockGetAdminReportes(filtros),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import AdminReportesPage from "./page";

beforeEach(() => {
  mockRequireRol.mockReset();
  mockGetAdminReportes.mockReset();
  mockRequireRol.mockResolvedValue({
    id: "admin-1",
    email: "admin@test.com",
    nombre: "Admin",
    rol: "ADMINISTRADOR",
  });
});

describe("AdminReportesPage (H06)", () => {
  it("exige el rol ADMINISTRADOR mediante requireRol", async () => {
    mockGetAdminReportes.mockResolvedValue({
      status: "ok",
      data: { datos: [], total: 0, pagina: 1, porPagina: 20 },
    });

    const ui = await AdminReportesPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(mockRequireRol).toHaveBeenCalledWith("ADMINISTRADOR");
    expect(
      screen.getByText(
        "No hay reportes que coincidan con los filtros seleccionados.",
      ),
    ).toBeInTheDocument();
  });

  it("renderiza la lista con badges de prioridad, estado, responsable y enlace al detalle", async () => {
    mockGetAdminReportes.mockResolvedValue({
      status: "ok",
      data: {
        total: 2,
        pagina: 1,
        porPagina: 20,
        datos: [
          {
            id: "rep-1",
            numero: "REP-000123",
            titulo: "Fuga de agua pasillo",
            categoria: "FUGA",
            ubicacion: "Torre A",
            estado: "EN_PROCESO",
            prioridad: "ALTA",
            responsable: "Proveedor Agua",
            creadoEn: "2026-11-02T14:30:00.000Z",
            residente: { id: "u-1", nombre: "Ana", email: "ana@test.com" },
            unidades: ["A-101"],
          },
          {
            id: "rep-2",
            numero: "REP-000124",
            titulo: "Ascensor trabado piso 3",
            categoria: "ASCENSOR",
            ubicacion: "Torre B",
            estado: "ABIERTO",
            prioridad: null,
            responsable: null,
            creadoEn: "2026-11-01T10:00:00.000Z",
            residente: { id: "u-2", nombre: "Luis", email: "luis@test.com" },
            unidades: ["B-205"],
          },
        ],
      },
    });

    const ui = await AdminReportesPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(screen.getByText("REP-000123")).toBeInTheDocument();
    expect(screen.getByText("Fuga de agua pasillo")).toBeInTheDocument();
    expect(screen.getByText("Alta")).toBeInTheDocument();
    expect(screen.getByText("Proveedor Agua")).toBeInTheDocument();

    expect(screen.getByText("REP-000124")).toBeInTheDocument();
    expect(screen.getAllByText("Sin asignar").length).toBeGreaterThanOrEqual(2);

    const links = screen.getAllByRole("link", { name: "Ver detalle" });
    expect(links[0]).toHaveAttribute("href", "/admin/reportes/rep-1");
    expect(links[1]).toHaveAttribute("href", "/admin/reportes/rep-2");
  });
});