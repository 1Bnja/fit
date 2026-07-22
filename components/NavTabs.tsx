"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, List, Users } from "reicon-react";

const TABS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/rutinas", label: "Rutinas", icon: List },
  { href: "/grupos", label: "Grupos", icon: Users },
];

export default function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-3xl">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              <Icon size={20} weight={active ? "Filled" : "Outline"} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
