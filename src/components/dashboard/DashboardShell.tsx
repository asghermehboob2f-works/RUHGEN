"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ExternalLink,
  FileStack,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Moon,
  PanelLeft,
  Sun,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AmbientBackdrop } from "@/components/AmbientBackdrop";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { CursorGlow } from "@/components/CursorGlow";

const nav = [
  { href: "/admindashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { href: "/admindashboard/content", label: "Content studio", icon: FileStack },
  { href: "/admindashboard/subscribers", label: "Newsletter", icon: Mail },
] as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase();
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const reduce = useReducedMotion();
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileNav ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNav]);

  useEffect(() => {
    setMobileNav(false);
  }, [pathname]);

  const active = (href: string, end?: boolean) => {
    if (end) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1" aria-label="Workspace">
      {nav.map((item) => {
        const isOn = active(item.href, "end" in item ? item.end : false);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="group flex min-h-[48px] items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors"
            style={{
              borderColor: "var(--border-subtle)",
              background: isOn ? "var(--deep-black)" : "var(--soft-black)",
              color: isOn ? "var(--text-primary)" : "var(--text-muted)",
            }}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                isOn
                  ? "border border-[var(--border-subtle)] bg-[var(--soft-black)]"
                  : "border border-[var(--border-subtle)] bg-[var(--deep-black)]"
              }`}
            >
              <item.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </span>
            {item.label}
          </Link>
        );
      })}

      <div className="my-4 h-px bg-[var(--border-subtle)]" />

      <Link
        href="/"
        onClick={onNavigate}
        className="flex min-h-[48px] items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--soft-black)",
        }}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--soft-black)]">
          <ExternalLink className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
        Marketing site
      </Link>
    </nav>
  );

  return (
    <>
      <AmbientBackdrop />
      <CursorGlow />
      <div className="app-grain fixed inset-0 z-[5]" aria-hidden />

      <div className="relative z-10 min-h-[100dvh]">
        {/* Desktop sidebar */}
        <aside
          className="dashboard-sidebar-rail fixed bottom-0 left-0 top-0 z-40 hidden w-[280px] flex-col border-r pt-[env(safe-area-inset-top)] lg:flex"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--rich-black)",
          }}
        >
          <div className="flex h-[4.25rem] items-center border-b px-5" style={{ borderColor: "var(--border-subtle)" }}>
            <BrandLogo size="md" showWordmark href="/admindashboard" className="min-w-0" />
          </div>
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6">
            <div>
              <p className="px-1 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
                Workspace
              </p>
              <div className="mt-3">
                <NavLinks />
              </div>
            </div>

            <div className="mt-auto rounded-2xl border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
                Admin console
              </p>
              <p className="mt-1 text-sm font-medium leading-snug" style={{ color: "var(--text-muted)" }}>
                Content & newsletter tools for site operators.
              </p>
            </div>
          </div>
        </aside>

        {/* Top bar + main */}
        <div className="flex min-h-[100dvh] flex-1 flex-col lg:pl-[280px]">
          <header
            className="sticky top-0 z-30 flex h-[4.25rem] items-center justify-between gap-3 border-b px-3 pt-[env(safe-area-inset-top)] sm:px-5"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--deep-black)",
            }}
          >
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border lg:hidden"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--glass)",
                  color: "var(--text-primary)",
                }}
                aria-expanded={mobileNav}
                aria-controls="dashboard-mobile-nav"
                onClick={() => setMobileNav(true)}
              >
                <Menu className="h-[18px] w-[18px]" />
                <span className="sr-only">Open menu</span>
              </button>
              <div className="hidden items-center gap-2 text-[var(--text-subtle)] lg:flex">
                <PanelLeft className="h-4 w-4 opacity-60" strokeWidth={1.75} />
                <span className="text-xs font-semibold uppercase tracking-[0.14em]">Console</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={toggle}
                className="flex h-10 w-10 items-center justify-center rounded-xl border transition-colors sm:h-11 sm:w-11"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--soft-black)",
                  color: "var(--text-primary)",
                }}
                aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
              >
                {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              </button>

              {ready && user && (
                <div
                  className="hidden max-w-[220px] items-center gap-2 rounded-xl border py-1.5 pl-1.5 pr-3 sm:flex"
                  style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{
                      background: "var(--deep-black)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {initials(user.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {user.name}
                    </p>
                    <p className="truncate font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {user.email}
                    </p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  signOut();
                  router.push("/");
                }}
                className="flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors hover:text-[var(--text-primary)] sm:text-sm"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--soft-black)",
                  color: "var(--text-muted)",
                }}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </header>

          <main className="relative flex-1" style={{ background: "var(--deep-black)" }}>
            <div className="relative z-10">{children}</div>
          </main>

          <footer
            className="border-t px-4 py-4 text-center text-[11px] sm:px-6 sm:text-xs"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--rich-black)",
              color: "var(--text-subtle)",
            }}
          >
            Admin dashboard
          </footer>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileNav && (
            <>
              <motion.button
                key="dash-nav-backdrop"
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.2 }}
                className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden"
                aria-label="Close menu"
                onClick={() => setMobileNav(false)}
              />
              <motion.div
                key="dash-nav-drawer"
                id="dashboard-mobile-nav"
                role="dialog"
                aria-modal="true"
                initial={reduce ? false : { x: "-100%" }}
                animate={{ x: 0 }}
                exit={reduce ? undefined : { x: "-100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                className="fixed bottom-0 left-0 top-0 z-50 flex w-[min(100%,300px)] flex-col border-r pt-[env(safe-area-inset-top)] shadow-2xl lg:hidden"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--rich-black)",
                }}
              >
                <div className="flex h-[4.25rem] items-center justify-between border-b px-4" style={{ borderColor: "var(--border-subtle)" }}>
                  <BrandLogo size="sm" showWordmark href="/admindashboard" />
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border"
                    style={{
                      borderColor: "var(--border-subtle)",
                      background: "var(--glass)",
                      color: "var(--text-primary)",
                    }}
                    onClick={() => setMobileNav(false)}
                  >
                    <X className="h-[18px] w-[18px]" />
                    <span className="sr-only">Close</span>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-5">
                  <NavLinks onNavigate={() => setMobileNav(false)} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
