import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hoyEnElSalvador, sumarDias } from "@/lib/format";

vi.mock("server-only", () => ({}));

const mockRequireRol = vi.fn();
vi.mock("@/lib/auth", () => ({
  requireRol: (...roles: string[]) => mockRequireRol(...roles),
}));

const mockGet = vi.fn();
vi.mock("@/lib/disponibilidad", () => ({
  getDisponibilidad: (fecha: string) => mockGet(fecha),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import Loading from "./loading";
import DisponibilidadPage from "./page";

const pagina = async (params: Record<string, string> = {}) =>
  render(await DisponibilidadPage({ searchParams: Promise.resolve(params) } as never));

const ok = (fecha: string) => ({
  status: "ok",
  data: {
    fecha,
    areas: [
      {
        id: "a1",
        nombre: "Alberca",
        capacidad: 30,
        bloques: [{ inicio: "07:00", fin: "08:00", estado: "OCUPADO" }],
      },
    ],
  },
});

beforeEach(() => {
  mockRequireRol.mockReset().mockResolvedValue({ rol: "RESIDENTE" });
  mockGet.mockReset();
});

describe("DisponibilidadPage", () => {
  it("exige Residente y por defecto consulta hoy", async () => {
    const hoy = hoyEnElSalvador();
    mockGet.mockResolvedValue(ok(hoy));
    await pagina();
    expect(mockRequireRol).toHaveBeenCalledWith("RESIDENTE");
    expect(mockGet).toHaveBeenCalledWith(hoy);
    expect(screen.getByLabelText("Fecha")).toHaveValue(hoy);
    expect(screen.getByRole("region", { name: "Alberca" })).toBeInTheDocument();
    expect(screen.getByText("No hay horarios libres para esta fecha")).toBeInTheDocument();
  });

  it("una fecha fuera de rango en la URL no llama al backend", async () => {
    await pagina({ fecha: sumarDias(hoyEnElSalvador(), 31) });
    expect(mockGet).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Elige una fecha entre hoy y los próximos 30 días");
  });

  it("400 del backend muestra el mismo mensaje de rango", async () => {
    mockGet.mockResolvedValue({ status: "bad_request", messages: ["x"] });
    await pagina({ fecha: sumarDias(hoyEnElSalvador(), 1) });
    expect(screen.getByRole("alert")).toHaveTextContent("Elige una fecha entre hoy y los próximos 30 días");
  });

  it("error del servidor ofrece reintentar; 403 muestra sin permiso", async () => {
    mockGet.mockResolvedValueOnce({ status: "error" });
    const { unmount } = await pagina();
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar la disponibilidad. Intenta de nuevo.");
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
    unmount();

    mockGet.mockResolvedValueOnce({ status: "forbidden" });
    await pagina();
    expect(screen.getByRole("alert")).toHaveTextContent("No tienes permiso para esta acción");
  });

  it("loading muestra el estado de carga", () => {
    render(<Loading />);
    expect(screen.getByLabelText("Cargando disponibilidad")).toHaveAttribute("aria-busy", "true");
  });
});
