import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EstadoAutorizacionBadge } from "./estado-autorizacion-badge";

describe("EstadoAutorizacionBadge", () => {
  it.each([
    ["VIGENTE", "Vigente", "green"],
    ["USADA", "Usada", "blue"],
    ["CANCELADA", "Cancelada", "zinc"],
    ["VENCIDA", "Vencida", "red"],
  ] as const)("%s", (estado, label, color) => {
    render(<EstadoAutorizacionBadge estado={estado} />);
    expect(screen.getByText(label).className).toContain(color);
  });
});
