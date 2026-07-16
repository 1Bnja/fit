import Link from "next/link";
import { logout } from "@/app/actions/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <nav className="flex gap-4 text-sm">
            <Link href="/home" className="hover:text-accent">
              Home
            </Link>
            <Link href="/rutinas" className="hover:text-accent">
              Rutinas
            </Link>
          </nav>
          <form action={logout}>
            <button type="submit" className="text-sm text-muted hover:text-foreground">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
