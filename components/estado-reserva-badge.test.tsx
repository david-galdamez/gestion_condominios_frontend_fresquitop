import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EstadoReservaBadge } from "./estado-reserva-badge";

describe("EstadoReservaBadge", () => {
  it.each([
    ["CONFIRMADA", "Confirmada", "green"],
    ["CANCELADA", "Cancelada", "zinc"],
    ["FINALIZADA", "Finalizada", "blue"],
  ] as const)("%s -> %s con color %s", (estado, texto, color) => {
    render(<EstadoReservaBadge estado={estado} />);
    expect(screen.getByText(texto).className).toContain(`bg-${color}-`);
  });
});
