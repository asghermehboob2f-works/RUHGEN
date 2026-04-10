"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CreditCard,
  Home,
  LogOut,
  Menu,
  Moon,
  Settings,
  Shield,
  Sun,
  UserCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: Home, end: true },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Preferences", icon: Settings },
  { href: "/dashboard/settings/account", label: "Account", icon: UserCircle },
] as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase();
}

function navActive(pathname: string, href: string, end?: boolean) {
  if (end) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function UserDashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, signOut } = useAuth();
  const { admin: adminSession } = useAdminAuth();
  const { theme, toggle } = useTheme();
  const reduce = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="relative min-h-[100dvh] overflow-x-clip">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden
        style={{
          background: "var(--deep-black)",
          backgroundImage:
            "radial-gradient(ellipse 90% 70% at 10% -10%, rgba(123, 97, 255, 0.22), transparent 50%), radial-gradient(ellipse 70% 55% at 95% 15%, rgba(0, 212, 255, 0.14), transparent 55%), radial-gradient(ellipse 55% 45% at 50% 100%, rgba(255, 46, 154, 0.08), transparent 50%)",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--primary-purple) 6%, transparent) 40%, transparent 100%)",
        }}
      />

      <header
        className="sticky top-0 z-50 border-b pt-[env(safe-area-inset-top)]"
        style={{
          borderColor: "var(--border-subtle)",
          background: "color-mix(in srgb, var(--deep-black) 88%, transparent)",
          backdropFilter: "blur(20px) saturate(160%)",
        }}
      >
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border sm:hidden"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--glass)",
                color: "var(--text-primary)",
              }}
              aria-expanded={mobileOpen}
              aria-controls="user-dash-mobile-nav"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-[18px] w-[18px]" strokeWidth={1.75} />
              <span className="sr-only">Open menu</span>
            </button>
            <BrandLogo size="sm" showWordmark href="/dashboard" className="min-w-0" />
          </div>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Dashboard">
            {navItems.map((item) => {
              const on = navActive(pathname, item.href, "end" in item ? item.end : false);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors"
                  style={{
                    border: "1px solid transparent",
                    color: on ? "var(--text-primary)" : "var(--text-muted)",
                    background: on ? "var(--glass)" : "transparent",
                    boxShadow: on ? "0 0 0 1px color-mix(in srgb, var(--primary-purple) 35%, transparent)" : undefined,
                  }}
                >
                  <item.icon className="h-4 w-4 opacity-80" strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              className="flex h-10 w-10 items-center justify-center rounded-xl border transition-colors"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--glass)",
                color: "var(--text-primary)",
              }}
              aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>

            <Link
              href={adminSession ? "/admindashboard" : "/admin/login"}
              className="hidden min-h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] lg:inline-flex"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--glass)",
              }}
              title="Operator console"
            >
              <Shield className="h-4 w-4 shrink-0 opacity-85" strokeWidth={1.75} />
              <span className="hidden xl:inline">Admin</span>
            </Link>

            {ready && user && (
              <div
                className="hidden items-center gap-2 rounded-xl border py-1 pl-1 pr-3 sm:flex"
                style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, var(--primary-purple), var(--primary-cyan))",
                  }}
                >
                  {initials(user.name)}
                </span>
                <div className="min-w-0 max-w-[140px]">
                  <p className="truncate text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                    {user.name}
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
              className="flex min-h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors sm:text-sm"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--glass)",
                color: "var(--text-muted)",
              }}
            >
              <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-10">{children}</main>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              key="user-dash-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
              className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm md:hidden"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              key="user-dash-drawer"
              id="user-dash-mobile-nav"
              role="dialog"
              aria-modal="true"
              initial={reduce ? false : { x: "-100%" }}
              animate={{ x: 0 }}
              exit={reduce ? undefined : { x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 top-0 z-[60] flex w-[min(100%,300px)] flex-col border-r pt-[env(safe-area-inset-top)] shadow-2xl md:hidden"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--rich-black)",
              }}
            >
              <div className="flex h-14 items-center justify-between border-b px-4" style={{ borderColor: "var(--border-subtle)" }}>
                <BrandLogo size="sm" showWordmark href="/dashboard" onNavigate={() => setMobileOpen(false)} />
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--glass)",
                    color: "var(--text-primary)",
                  }}
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-[18px] w-[18px]" />
                  <span className="sr-only">Close</span>
                </button>
              </div>
              <nav className="flex flex-col gap-1 p-4" aria-label="Dashboard mobile">
                {navItems.map((item) => {
                  const on = navActive(pathname, item.href, "end" in item ? item.end : false);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex min-h-[48px] items-center gap-3 rounded-xl border px-3.5 text-sm font-semibold"
                      style={{
                        borderColor: on ? "color-mix(in srgb, var(--primary-purple) 40%, var(--border-subtle))" : "var(--border-subtle)",
                        background: on ? "var(--glass)" : "var(--soft-black)",
                        color: on ? "var(--text-primary)" : "var(--text-muted)",
                      }}
                    >
                      <item.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
