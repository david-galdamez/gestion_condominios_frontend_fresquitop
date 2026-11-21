import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { formatPorcentaje, Variacion } from "./variacion";

describe("Variacion", () => {
  it("muestra 'Sin base de comparación' cuando el cambio es null", () => {
    render(<Variacion cambio={null} />);
    expect(screen.getByText("Sin base de comparación")).toBeInTheDocument();
  });

  it("muestra flecha hacia arriba y el porcentaje con un decimal", () => {
    render(<Variacion cambio={5.2} />);
    expect(screen.getByText("▲")).toBeInTheDocument();
    expect(screen.getByText(/5.2 %/)).toBeInTheDocument();
    expect(screen.getByText(/más que el periodo anterior/)).toBeInTheDocument();
  });

  it("muestra flecha hacia abajo cuando baja", () => {
    render(<Variacion cambio={-10} />);
    expect(screen.getByText("▼")).toBeInTheDocument();
    expect(screen.getByText(/10.0 %/)).toBeInTheDocument();
  });

  it("en incidencias, bajar es bueno (verde) y subir es malo (rojo)", () => {
    const { container, rerender } = render(<Variacion cambio={-10} menosEsMejor />);
    expect(container.firstChild).toHaveClass("text-emerald-700");
    rerender(<Variacion cambio={10} menosEsMejor />);
    expect(container.firstChild).toHaveClass("text-red-700");
  });

  it("formatPorcentaje usa un decimal", () => {
    expect(formatPorcentaje(30)).toBe("30.0 %");
  });
});
