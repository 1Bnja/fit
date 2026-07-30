import Link from "next/link";
import { logout } from "@/app/actions/auth";
import NavTabs from "@/components/NavTabs";
import { mascotaEstaInactiva } from "@/lib/mascota.mjs";
import { createClient } from "@/lib/supabase/server";
import { Logout, User } from "reicon-react";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("last_active_at, created_at")
      .eq("id", user.id)
      .single();

    if (!mascotaEstaInactiva(profile?.last_active_at ?? profile?.created_at)) {
      await supabase
        .from("profiles")
        .update({ last_active_at: new Date().toISOString() })
        .eq("id", user.id);
    }
  }

  return (
    <div className="flex flex-1 flex-col pb-16">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <span className="text-sm font-medium">Fit</span>
          <div className="flex items-center gap-4">
            <Link
              href="/perfil"
              aria-label="Tu perfil"
              className="flex items-center text-muted hover:text-foreground"
            >
              <User size={18} />
            </Link>
            <form action={logout} className="flex items-center">
              <button
                type="submit"
                aria-label="Cerrar sesión"
                className="flex items-center text-muted hover:text-foreground"
              >
                <Logout size={18} />
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
