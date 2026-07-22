import Link from "next/link";
import { logout } from "@/app/actions/auth";
import NavTabs from "@/components/NavTabs";
import { Logout, UserCircle } from "reicon-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col pb-16">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <span className="text-sm font-medium">Fit</span>
          <div className="flex items-center gap-4">
            <Link href="/perfil" aria-label="Tu perfil" className="text-muted hover:text-foreground">
              <UserCircle size={20} />
            </Link>
            <form action={logout}>
              <button type="submit" aria-label="Cerrar sesión" className="text-muted hover:text-foreground">
                <Logout size={16} />
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
      <NavTabs />
    </div>
  );
}
