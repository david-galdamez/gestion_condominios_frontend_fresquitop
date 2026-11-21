import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ModuloOrigenBadge } from "./modulo-origen-badge";

describe("ModuloOrigenBadge", () => {
  it.each([
    ["PAGOS", "Pagos", "emerald"],
    ["RESERVAS", "Reservas", "blue"],
    ["INCIDENCIAS", "Incidencias", "amber"],
    ["VISITAS", "Visitas", "purple"],
    ["PAQUETERIA", "Paquetería", "orange"],
    ["VOTACIONES", "Votaciones", "indigo"],
    ["COMUNICADOS", "Comunicados", "sky"],
  ] as const)(
    "%s renderiza la etiqueta '%s', su ícono SVG y color %s",
    (modulo, etiqueta, color) => {
      render(<ModuloOrigenBadge moduloOrigen={modulo} />);

      const badge = screen.getByText(etiqueta);
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain(`bg-${color}-100`);
      expect(badge.className).toContain(`text-${color}-800`);

      const svg = badge.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("data-modulo-icono", modulo);
    },
  );

  it("normaliza mayúsculas y espacios alrededor del módulo", () => {
    render(<ModuloOrigenBadge moduloOrigen="  pagos  " />);

    const badge = screen.getByText("Pagos");
    expect(badge.className).toContain("bg-emerald-100");
    expect(badge.querySelector("svg")).toHaveAttribute(
      "data-modulo-icono",
      "PAGOS",
    );
  });

  it("aplica un fallback seguro cuando llega un módulo inesperado", () => {
    render(<ModuloOrigenBadge moduloOrigen="MANTENIMIENTO_EXTERNO" />);

    const badge = screen.getByText("MANTENIMIENTO_EXTERNO");
    expect(badge.className).toContain("bg-zinc-100");
    expect(badge.className).toContain("text-zinc-800");

    const svg = badge.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("data-modulo-icono", "FALLBACK");
  });

  it("usa 'General' como texto de fallback cuando el valor está vacío", () => {
    render(<ModuloOrigenBadge moduloOrigen="   " />);

    const badge = screen.getByText("General");
    expect(badge.className).toContain("bg-zinc-100");
    expect(badge.querySelector("svg")).toHaveAttribute(
      "data-modulo-icono",
      "FALLBACK",
    );
  });
});