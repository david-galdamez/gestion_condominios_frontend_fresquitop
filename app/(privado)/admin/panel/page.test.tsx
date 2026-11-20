import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockRequireRol = vi.fn();
vi.mock("@/lib/auth", () => ({
  requireRol: (...roles: string[]) => mockRequireRol(...roles),
}));

const mockGetPanel = vi.fn();
vi.mock("@/lib/panel", () => ({
  getPanel: (periodo: unknown) => mockGetPanel(periodo),
}));

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

import Loading from "./loading";
import PanelPage from "./page";

const datos = {
  mora: { monto: 1350, unidadesMorosas: 9, porcentajeMorosas: 30 },
  ocupacion: [
    { area: "Alberca", porcentaje: 42.5, cambio: 5.2 },
    { area: "Salón", porcentaje: 0, cambio: null },
  ],
  areaMasUsada: "Alberca",
  incidencias: { ALTA: 2, MEDIA: 4, BAJA: 1, SIN_ASIGNAR: 3, cambio: -10 },
  participacion: [{ asamblea: "Asamblea de noviembre", porcentaje: 70 }],
  generadoEn: "2026-11-20T18:00:00.000Z",
};

async function renderPanel(sp: Record<string, string> = {}) {
  render(await PanelPage({ searchParams: Promise.resolve(sp) }));
}

beforeEach(() => {
  mockRequireRol.mockReset();
  mockGetPanel.mockReset();
  push.mockReset();
  mockRequireRol.mockResolvedValue({ id: "a1", nombre: "Admin", rol: "ADMINISTRADOR" });
  mockGetPanel.mockResolvedValue({ status: "ok", data: datos });
});

describe("PanelPage", () => {
  it("exige el rol ADMINISTRADOR", async () => {
    await renderPanel();
    expect(mockRequireRol).toHaveBeenCalledWith("ADMINISTRADOR");
  });

  it("muestra mora, % de unidades morosas e incidencias abiertas", async () => {
    await renderPanel();
    const principales = screen.getByRole("region", { name: "Indicadores principales" });
    expect(within(principales).getByText(/1,350\.00/)).toBeInTheDocument();
    expect(within(principales).getByText("30.0 %")).toBeInTheDocument();
    expect(within(principales).getByText(/9 unidades con cuotas vencidas/)).toBeInTheDocument();
    expect(within(principales).getByText("10")).toBeInTheDocument(); // 2+4+1+3
  });

  it("muestra la ocupación por área, marca la más usada y 'Sin base de comparación'", async () => {
    await renderPanel();
    const sec = screen.getByRole("region", { name: "Ocupación de áreas comunes" });
    expect(within(sec).getByText("Más usada")).toBeInTheDocument();
    expect(within(sec).getByRole("img", { name: /Alberca: 42.5 % de ocupación/ })).toBeInTheDocument();
    expect(within(sec).getByText("Sin base de comparación")).toBeInTheDocument();
  });

  it("muestra incidencias por prioridad y participación", async () => {
    await renderPanel();
    const inc = screen.getByRole("region", { name: "Incidencias por prioridad" });
    for (const etiqueta of ["Alta", "Media", "Baja", "Sin asignar"]) {
      expect(within(inc).getByText(etiqueta)).toBeInTheDocument();
    }
    const part = screen.getByRole("region", { name: "Participación en asambleas" });
    expect(within(part).getByText("Asamblea de noviembre")).toBeInTheDocument();
    expect(within(part).getByText("70.0 %")).toBeInTheDocument();
  });

  it("consulta el periodo de la URL", async () => {
    await renderPanel({ periodo: "rango", desde: "2026-09-01", hasta: "2026-09-30" });
    expect(mockGetPanel).toHaveBeenCalledWith(
      expect.objectContaining({ desde: "2026-09-01", hasta: "2026-09-30" }),
    );
    expect(screen.getByText("Del 01/09/2026 al 30/09/2026")).toBeInTheDocument();
  });

  it("un rango inválido en la URL muestra el error y no consulta al backend", async () => {
    await renderPanel({ periodo: "rango", desde: "2026-09-30", hasta: "2026-09-01" });
    expect(screen.getByRole("alert")).toHaveTextContent(/posterior/);
    expect(mockGetPanel).not.toHaveBeenCalled();
  });

  it("sin áreas ni asambleas muestra estados vacíos", async () => {
    mockGetPanel.mockResolvedValue({
      status: "ok",
      data: { ...datos, ocupacion: [], areaMasUsada: null, participacion: [] },
    });
    await renderPanel();
    expect(screen.getByText("No hay áreas comunes activas.")).toBeInTheDocument();
    expect(screen.getByText("No hubo asambleas cerradas en este periodo.")).toBeInTheDocument();
  });

  it("403 muestra 'No tienes permiso para esta acción'", async () => {
    mockGetPanel.mockResolvedValue({ status: "forbidden" });
    await renderPanel();
    expect(screen.getByRole("alert")).toHaveTextContent("No tienes permiso para esta acción");
  });

  it("error del servidor muestra el mensaje y permite reintentar", async () => {
    mockGetPanel.mockResolvedValue({ status: "error" });
    await renderPanel();
    expect(screen.getByRole("alert")).toHaveTextContent(/No pudimos cargar el panel/);
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(refresh).toHaveBeenCalled();
  });

  it("el selector cambia de periodo y navega con el periodo en la URL", async () => {
    await renderPanel();
    await userEvent.selectOptions(screen.getByLabelText("Periodo"), "3m");
    await userEvent.click(screen.getByRole("button", { name: "Aplicar" }));
    expect(push).toHaveBeenCalledWith("/admin/panel?periodo=3m");
  });

  it("el rango personalizado valida antes de navegar", async () => {
    await renderPanel();
    await userEvent.selectOptions(screen.getByLabelText("Periodo"), "rango");
    await userEvent.type(screen.getByLabelText("Desde"), "2026-09-30");
    await userEvent.type(screen.getByLabelText("Hasta"), "2026-09-01");
    await userEvent.click(screen.getByRole("button", { name: "Aplicar" }));
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/posterior/);

    await userEvent.clear(screen.getByLabelText("Hasta"));
    await userEvent.type(screen.getByLabelText("Hasta"), "2026-10-15");
    await userEvent.click(screen.getByRole("button", { name: "Aplicar" }));
    expect(push).toHaveBeenCalledWith(
      "/admin/panel?periodo=rango&desde=2026-09-30&hasta=2026-10-15",
    );
  });
});

describe("Loading", () => {
  it("muestra un esqueleto accesible", () => {
    render(<Loading />);
    expect(screen.getByLabelText("Cargando panel de salud del condominio")).toHaveAttribute("aria-busy", "true");
  });
});
