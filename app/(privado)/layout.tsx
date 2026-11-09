import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { SessionProvider } from "@/components/session-provider";
import { getSessionUser, type Rol } from "@/lib/session";

const ROL_LABEL: Record<Rol, string> = {
  RESIDENTE: "Residente",
  ADMINISTRADOR: "Administrador",
  SEGURIDAD: "Seguridad",
};

const MENU: { href: string; label: string; roles?: Rol[] }[] = [
  { href: "/", label: "Inicio" },
  { href: "/estado-cuenta", label: "Estado de cuenta", roles: ["RESIDENTE"] },
  { href: "/visitas", label: "Visitas", roles: ["RESIDENTE"] },
  { href: "/reportes", label: "Mis reportes", roles: ["RESIDENTE"] },
  { href: "/porteria/paquetes", label: "Paquetes", roles: ["SEGURIDAD"] },
  { href: "/admin/areas", label: "Áreas comunes", roles: ["ADMINISTRADOR"] },
];

export default async function PrivadoLayout({
  children,
}: LayoutProps<"/">) {
  const user = await getSessionUser();
  if (!user) redirect("/api/sesion/expirada");

  const links = MENU.filter((l) => !l.roles || l.roles.includes(user.rol));

  return (
    <SessionProvider user={user}>
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-6 px-4 py-3">
          <span className="font-semibold">Condominios</span>
          <nav className="flex flex-1 gap-4 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-zinc-600 hover:text-foreground dark:text-zinc-400"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="text-right text-sm leading-tight">
            <div className="font-medium">{user.nombre}</div>
            <div className="text-xs text-zinc-500">{ROL_LABEL[user.rol]}</div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8">
        {children}
      </main>
    </SessionProvider>
  );
}
