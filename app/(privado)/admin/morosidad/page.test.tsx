import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockRequireRol = vi.fn();
vi.mock("@/lib/auth", () => ({
  requireRol: (...roles: string[]) => mockRequireRol(...roles),
}));

const mockGetMorosidad = vi.fn();
vi.mock("@/lib/morosidad", () => ({
  getMorosidad: (filtros: unknown) => mockGetMorosidad(filtros),
}));

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => new URLSearchParams(),
}));

import ErrorBoundary from "./error";
import Loading from "./loading";
import MorosidadPage from "./page";

beforeEach(() => {
  mockRequireRol.mockReset();
  mockGetMorosidad.mockReset();
  push.mockReset();
  refresh.mockReset();
  mockRequireRol.mockResolvedValue({
    id: "admin-1",
    email: "admin@test.com",
    nombre: "Admin",
    rol: "ADMINISTRADOR",
  });
});

describe("MorosidadPage", () => {
  it("exige el rol ADMINISTRADOR mediante requireRol", async () => {
    mockGetMorosidad.mockResolvedValue({
      status: "ok",
      data: {
        totalMora: 0,
        unidadesMorosas: 0,
        datos: [],
        total: 0,
        pagina: 1,
      },
    });

    const ui = await MorosidadPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(mockRequireRol).toHaveBeenCalledWith("ADMINISTRADOR");
  });

  it("muestra tarjetas de métricas y tabla formateada con moneda y fecha", async () => {
    mockGetMorosidad.mockResolvedValue({
      status: "ok",
      data: {
        totalMora: 1350,
        unidadesMorosas: 9,
        datos: [
          {
            unidad: "B-204",
            cuotasVencidas: 3,
            montoAdeudado: 135,
            vencidaMasAntigua: "2026-08-10",
          },
          {
            unidad: "A-102",
            cuotasVencidas: 1,
            montoAdeudado: 45,
            vencidaMasAntigua: "2026-10-10",
          },
        ],
        total: 9,
        pagina: 1,
      },
    });

    const ui = await MorosidadPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(
      screen.getByRole("heading", { name: "Morosidad de Unidades" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Total en Mora")).toBeInTheDocument();
    expect(screen.getByText("Unidades Morosas")).toBeInTheDocument();
    expect(screen.getByText(/1[.,]350[.,]00/)).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();

    expect(screen.getByText("B-204")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(/135[.,]00/)).toBeInTheDocument();
    expect(screen.getByText("10/08/2026")).toBeInTheDocument();

    expect(screen.getByText("A-102")).toBeInTheDocument();
    expect(screen.getByText("10/10/2026")).toBeInTheDocument();

    // Con total = 9 (<= 20) no se muestra la barra de paginación.
    expect(
      screen.queryByRole("navigation", { name: "Paginación" }),
    ).not.toBeInTheDocument();
  });

  it("muestra el estado vacío exacto 'No hay unidades morosas' cuando datos está vacío", async () => {
    mockGetMorosidad.mockResolvedValue({
      status: "ok",
      data: {
        totalMora: 0,
        unidadesMorosas: 0,
        datos: [],
        total: 0,
        pagina: 1,
      },
    });

    const ui = await MorosidadPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(screen.getByText("No hay unidades morosas")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("muestra la paginación cuando total > 20", async () => {
    mockGetMorosidad.mockResolvedValue({
      status: "ok",
      data: {
        totalMora: 2500,
        unidadesMorosas: 25,
        datos: [
          {
            unidad: "B-204",
            cuotasVencidas: 3,
            montoAdeudado: 135,
            vencidaMasAntigua: "2026-08-10",
          },
        ],
        total: 25,
        pagina: 1,
      },
    });

    const ui = await MorosidadPage({
      searchParams: Promise.resolve({ torreId: "Torre A", pagina: "1" }),
    });
    render(ui);

    const nav = screen.getByRole("navigation", { name: "Paginación" });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Siguiente" })).toHaveAttribute(
      "href",
      "/admin/morosidad?torreId=Torre+A&pagina=2",
    );
  });

  it("muestra mensaje de error y botón de reintento cuando falla la carga", async () => {
    mockGetMorosidad.mockResolvedValue({ status: "error" });

    const ui = await MorosidadPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No pudimos cargar el reporte de morosidad. Intenta de nuevo.",
    );
    expect(
      screen.getByRole("button", { name: "Reintentar" }),
    ).toBeInTheDocument();
  });

  it("Loading muestra el skeleton con aria-busy", () => {
    render(<Loading />);
    expect(
      screen.getByLabelText("Cargando reporte de morosidad"),
    ).toHaveAttribute("aria-busy", "true");
  });

  it("Error boundary invoca retry/reset al hacer clic en Reintentar", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<ErrorBoundary error={new Error("Fallo")} retry={retry} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No pudimos cargar el reporte de morosidad. Intenta de nuevo.",
    );
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(retry).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });
});