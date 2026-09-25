"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  FolderOpen,
  Library,
  Settings,
  LogOut,
  ExternalLink,
  FileText,
  Languages,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/generate", label: "AI Generate", icon: Sparkles },
  { href: "/admin/patterns", label: "Pattern library", icon: Library },
  { href: "/admin/categories", label: "Categories", icon: FolderOpen },
  { href: "/admin/pages", label: "Pages & SEO", icon: FileText },
  { href: "/admin/translations", label: "Translations", icon: Languages },
  { href: "/admin/purchases", label: "Purchases", icon: ShoppingBag },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-7xl gap-0 md:gap-6">
        <aside className="hidden w-60 shrink-0 border-r border-slate-800 p-4 md:block">
          <div className="mb-8 px-2">
            <p className="text-xs font-bold uppercase tracking-widest text-rose-300">
              Loopcraft
            </p>
            <p className="font-semibold text-white">Studio Admin</p>
          </div>
          <nav className="space-y-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                    active
                      ? "bg-rose-500/20 text-rose-200"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-8 space-y-2 px-2">
            <a
              href="/"
              target="_blank"
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View site
            </a>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-rose-300"
            >
              <LogOut className="h-3.5 w-3.5" /> Log out
            </button>
          </div>
        </aside>
        <div className="min-w-0 flex-1 p-4 md:p-8">
          <div className="mb-6 flex items-center justify-between gap-3 md:hidden">
            <p className="font-semibold">Admin</p>
            <button type="button" onClick={logout} className="text-sm text-slate-400">
              Log out
            </button>
          </div>
          <h1 className="mb-6 text-2xl font-semibold text-white">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
