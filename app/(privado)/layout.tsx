import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { SessionProvider } from "@/components/session-provider";
import { getSessionUser, type Rol } from "@/lib/session";
import { CampanaNotificaciones } from '@/components/campana-notificaciones';
import { getConteoNoLeidas } from '@/lib/notificaciones';

const ROL_LABEL: Record<Rol, string> = {
  RESIDENTE: "Residente",
  ADMINISTRADOR: "Administrador",
  SEGURIDAD: "Seguridad",
};

const MENU: { href: string; label: string; roles?: Rol[] }[] = [
  { href: "/", label: "Inicio" },
  { href: "/estado-cuenta", label: "Estado de cuenta", roles: ["RESIDENTE"] },
  { href: "/visitas", label: "Visitas", roles: ["RESIDENTE"] },
  { href: "/reservas", label: "Reservas", roles: ["RESIDENTE"] },
  { href: "/reportes", label: "Mis reportes", roles: ["RESIDENTE"] },
  { href: "/directorio/mi-perfil", label: "Mi directorio", roles: ["RESIDENTE"] },
  { href: "/asambleas", label: "Asambleas", roles: ["RESIDENTE"] },
  { href: "/comunicados", label: "Comunicados", roles: ["RESIDENTE"] },
  { href: "/porteria/accesos", label: "Accesos", roles: ["SEGURIDAD"] },
  { href: "/porteria/paquetes", label: "Paquetes", roles: ["SEGURIDAD"] },
  { href: "/admin/panel", label: "Panel", roles: ["ADMINISTRADOR"] },
  { href: "/admin/reportes", label: "Reportes", roles: ["ADMINISTRADOR"] },
  { href: "/admin/cuotas", label: "Cuotas", roles: ["ADMINISTRADOR"] },
  { href: "/admin/usuarios/nuevo", label: "Residentes", roles: ["ADMINISTRADOR"] },
  { href: "/admin/unidades/nueva", label: "Unidades", roles: ["ADMINISTRADOR"] },
  { href: "/admin/areas", label: "Áreas comunes", roles: ["ADMINISTRADOR"] },
  { href: "/admin/morosidad", label: "Morosidad", roles: ["ADMINISTRADOR"] },
  { href: "/admin/comunicados", label: "Comunicados", roles: ["ADMINISTRADOR"] },
  { href: "/admin/asambleas", label: "Asambleas", roles: ["ADMINISTRADOR"] },
  { href: "/notificaciones", label: "Notificaciones", roles: ["RESIDENTE"] },
  { href: "/mis-paquetes", label: "Mis Paquetes", roles: ["RESIDENTE"] },
];

export default async function PrivadoLayout({
  children,
}: LayoutProps<"/">) {
  const user = await getSessionUser();
  if (!user) redirect("/api/sesion/expirada");

  const links = MENU.filter((l) => !l.roles || l.roles.includes(user.rol));

  const conteo = user.rol === 'RESIDENTE' ? await getConteoNoLeidas() : { noLeidas: 0 };

  return (
    <SessionProvider user={user}>
      <Navbar
        links={links}
        nombre={user.nombre}
        rolLabel={ROL_LABEL[user.rol]}
        campana={
          user.rol === "RESIDENTE" ? (
            <CampanaNotificaciones inicial={conteo.noLeidas} />
          ) : undefined
        }
      />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8">
        {children}
      </main>
    </SessionProvider>
  );
}