import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockRequireRol = vi.fn();
vi.mock("@/lib/auth", () => ({
  requireRol: (...roles: string[]) => mockRequireRol(...roles),
}));

const mockGetNotificaciones = vi.fn();
vi.mock("@/lib/notificaciones", () => ({
  getNotificaciones: (pagina?: number) => mockGetNotificaciones(pagina),
}));

import NotificacionesPage from "./page";

beforeEach(() => {
  mockRequireRol.mockReset();
  mockGetNotificaciones.mockReset();
  mockRequireRol.mockResolvedValue({
    id: "res-1",
    email: "residente@test.com",
    nombre: "Carlos",
    rol: "RESIDENTE",
  });
});

describe("NotificacionesPage (H17 / FE-18.1)", () => {
  it("exige el rol RESIDENTE y muestra el estado vacío cuando no hay avisos", async () => {
    mockGetNotificaciones.mockResolvedValue({
      datos: [],
      total: 0,
      pagina: 1,
      totalPaginas: 1,
    });

    const ui = await NotificacionesPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(mockRequireRol).toHaveBeenCalledWith("RESIDENTE");
    expect(mockGetNotificaciones).toHaveBeenCalledWith(1);
    expect(screen.getByText("No tienes avisos")).toBeInTheDocument();
  });

  it("muestra cada aviso con su ModuloOrigenBadge (etiqueta + SVG), enlace, estado leído y paginación", async () => {
    mockGetNotificaciones.mockResolvedValue({
      datos: [
        {
          id: "notif-1",
          titulo: "Pago confirmado",
          mensaje: "Tu cuota de noviembre fue aprobada.",
          moduloOrigen: "PAGOS",
          referencia: "/estado-cuenta",
          leida: false,
          leidaEn: null,
          createdAt: "2026-11-20T15:00:00.000Z",
        },
        {
          id: "notif-2",
          titulo: "Paquete en portería",
          mensaje: "Tienes una encomienda lista para retirar.",
          moduloOrigen: "PAQUETERIA",
          referencia: "/paquetes",
          leida: true,
          leidaEn: "2026-11-20T16:00:00.000Z",
          createdAt: "2026-11-20T14:00:00.000Z",
        },
        {
          id: "notif-3",
          titulo: "Incidencia resuelta",
          mensaje: "Se reparó la luminaria del pasillo.",
          moduloOrigen: "INCIDENCIAS",
          referencia: null,
          leida: false,
          leidaEn: null,
          createdAt: "2026-11-20T13:00:00.000Z",
        },
      ],
      total: 30,
      pagina: 1,
      totalPaginas: 3,
    });

    const ui = await NotificacionesPage({ searchParams: Promise.resolve({}) });
    render(ui);

    const badgePagos = screen.getByText("Pagos");
    expect(badgePagos.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );

    const badgePaqueteria = screen.getByText("Paquetería");
    expect(badgePaqueteria.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );

    const badgeIncidencias = screen.getByText("Incidencias");
    expect(badgeIncidencias.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );

    const linkNoLeida = screen.getByRole("link", { name: /Pago confirmado/i });
    expect(linkNoLeida).toHaveAttribute("href", "/estado-cuenta");
    expect(linkNoLeida.className).toContain("bg-blue-50");

    const linkLeida = screen.getByRole("link", { name: /Paquete en portería/i });
    expect(linkLeida).toHaveAttribute("href", "/paquetes");
    expect(linkLeida.className).toContain("bg-white");

    const linkSinReferencia = screen.getByRole("link", {
      name: /Incidencia resuelta/i,
    });
    expect(linkSinReferencia).toHaveAttribute("href", "#");

    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Siguiente" })).toHaveAttribute(
      "href",
      "/notificaciones?pagina=2",
    );
  });

  it("solicita la página indicada en searchParams y renderiza módulos desconocidos con fallback", async () => {
    mockGetNotificaciones.mockResolvedValue({
      datos: [
        {
          id: "notif-4",
          titulo: "Aviso del sistema",
          mensaje: "Mantenimiento programado.",
          moduloOrigen: "SISTEMA",
          referencia: "/comunicados",
          leida: true,
          leidaEn: "2026-11-20T18:00:00.000Z",
          createdAt: "2026-11-20T17:00:00.000Z",
        },
      ],
      total: 25,
      pagina: 2,
      totalPaginas: 3,
    });

    const ui = await NotificacionesPage({
      searchParams: Promise.resolve({ pagina: "2" }),
    });
    render(ui);

    expect(mockGetNotificaciones).toHaveBeenCalledWith(2);

    const badgeFallback = screen.getByText("SISTEMA");
    expect(badgeFallback.className).toContain("bg-zinc-100");
    expect(badgeFallback.querySelector("svg")).toHaveAttribute(
      "data-modulo-icono",
      "FALLBACK",
    );

    expect(screen.getByRole("link", { name: "Anterior" })).toHaveAttribute(
      "href",
      "/notificaciones?pagina=1",
    );
    expect(screen.getByRole("link", { name: "Siguiente" })).toHaveAttribute(
      "href",
      "/notificaciones?pagina=3",
    );
  });
});