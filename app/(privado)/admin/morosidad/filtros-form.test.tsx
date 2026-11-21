import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
let search = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(search),
}));

import { FiltrosMorosidadForm } from "./filtros-form";

beforeEach(() => {
  push.mockReset();
  search = "";
});

describe("FiltrosMorosidadForm", () => {
  it("renderiza las opciones Todas, Torre A, Torre B y Torre C", () => {
    render(<FiltrosMorosidadForm />);
    const select = screen.getByLabelText("Torre");
    expect(select).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Todas" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Torre A" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Torre B" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Torre C" })).toBeInTheDocument();
  });

  it("al seleccionar una torre actualiza la URL con ?torreId=...", async () => {
    const user = userEvent.setup();
    render(<FiltrosMorosidadForm />);
    await user.selectOptions(screen.getByLabelText("Torre"), "Torre A");
    expect(push).toHaveBeenCalledWith("/admin/morosidad?torreId=Torre+A");
  });

  it("al seleccionar Todas navega a /admin/morosidad sin query params", async () => {
    search = "torreId=Torre+A&pagina=2";
    const user = userEvent.setup();
    render(<FiltrosMorosidadForm torreId="Torre A" />);
    await user.selectOptions(screen.getByLabelText("Torre"), "");
    expect(push).toHaveBeenCalledWith("/admin/morosidad");
  });

  it("al enviar el formulario con el botón Aplicar navega con el torreId seleccionado", async () => {
    const user = userEvent.setup();
    render(
      <FiltrosMorosidadForm
        torres={[
          { id: "uuid-torre-a", nombre: "Torre A" },
          { id: "uuid-torre-b", nombre: "Torre B" },
        ]}
        torreId="uuid-torre-b"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Aplicar" }));
    expect(push).toHaveBeenCalledWith("/admin/morosidad?torreId=uuid-torre-b");
  });
});