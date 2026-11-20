import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AreaDisponibilidad } from "@/lib/types/disponibilidad";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import { DisponibilidadVista } from "./disponibilidad-vista";

const HOY = "2026-11-20";
const MANANA = "2026-11-21";

const alberca: AreaDisponibilidad = {
  id: "a1",
  nombre: "Alberca",
  capacidad: 30,
  bloques: [
    { inicio: "07:00", fin: "08:00", estado: "LIBRE" },
    { inicio: "08:00", fin: "09:00", estado: "OCUPADO" },
  ],
};
const salon: AreaDisponibilidad = {
  id: "a2",
  nombre: "Salón",
  capacidad: 1,
  bloques: [{ inicio: "10:00", fin: "11:00", estado: "OCUPADO" }],
};

const vista = (props: Partial<React.ComponentProps<typeof DisponibilidadVista>> = {}) =>
  render(
    <DisponibilidadVista hoy={HOY} fecha={MANANA} areaId="" areas={[alberca, salon]} {...props} />,
  );

beforeEach(() => push.mockReset());

describe("DisponibilidadVista", () => {
  it("muestra cada área con sus bloques Libre (enlace) y Ocupado (deshabilitado)", () => {
    vista();
    const a = within(screen.getByRole("region", { name: "Alberca" }));
    expect(a.getByText("Capacidad 30 personas")).toBeInTheDocument();
    expect(a.getByRole("link", { name: "Reservar Alberca de 07:00 a 08:00" })).toHaveAttribute(
      "href",
      "/reservas/nueva?areaId=a1&fecha=2026-11-21&horaInicio=07%3A00",
    );
    expect(a.getByRole("button", { name: "Alberca de 08:00 a 09:00: ocupado" })).toBeDisabled();
    expect(screen.getByRole("region", { name: "Salón" })).toHaveTextContent("Capacidad 1 persona");
    expect(screen.queryByText("No hay horarios libres para esta fecha")).not.toBeInTheDocument();
  });

  it("el selector de fecha va de hoy a hoy + 30", () => {
    vista();
    const fecha = screen.getByLabelText("Fecha");
    expect(fecha).toHaveValue(MANANA);
    expect(fecha).toHaveAttribute("min", HOY);
    expect(fecha).toHaveAttribute("max", "2026-12-20");
  });

  it("filtrar por un área sin bloques libres muestra el aviso", async () => {
    const user = userEvent.setup();
    vista();
    await user.selectOptions(screen.getByLabelText("Área"), "a2");
    expect(screen.queryByRole("region", { name: "Alberca" })).not.toBeInTheDocument();
    expect(screen.getByText("No hay horarios libres para esta fecha")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Área"), "");
    expect(screen.getByRole("region", { name: "Alberca" })).toBeInTheDocument();
  });

  it("llega con el área elegida desde la URL", () => {
    vista({ areaId: "a1" });
    expect(screen.getByLabelText("Área")).toHaveValue("a1");
    expect(screen.queryByRole("region", { name: "Salón" })).not.toBeInTheDocument();
  });

  it("al cambiar la fecha pide la nueva disponibilidad conservando el área", async () => {
    vista({ areaId: "a1" });
    fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: "2026-11-25" } });
    expect(push).toHaveBeenCalledWith("/reservas/disponibilidad?fecha=2026-11-25&areaId=a1");
  });

  it("una fecha fuera de rango muestra el mensaje y no navega", () => {
    vista();
    for (const fecha of ["2026-11-19", "2026-12-21"]) {
      fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: fecha } });
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Elige una fecha entre hoy y los próximos 30 días",
      );
      expect(screen.queryByRole("region")).not.toBeInTheDocument();
    }
    expect(push).not.toHaveBeenCalled();
  });

  it("muestra el aviso que manda la página en lugar de los bloques", () => {
    vista({ areas: [], aviso: "Elige una fecha entre hoy y los próximos 30 días" });
    expect(screen.getByRole("alert")).toHaveTextContent("Elige una fecha entre hoy y los próximos 30 días");
    expect(screen.getByLabelText("Área")).toBeDisabled();
  });

  it("sin áreas activas lo indica", () => {
    vista({ areas: [] });
    expect(screen.getByText("No hay áreas disponibles para reservar")).toBeInTheDocument();
  });
});
