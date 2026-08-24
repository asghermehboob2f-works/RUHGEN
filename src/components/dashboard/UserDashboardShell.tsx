"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Coins,
  CreditCard,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Video,
  X,
  BookOpen,
  Headphones,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { VerificationBanner } from "@/components/dashboard/VerificationBanner";

const workspaceNav = [
  { href: "/dashboard", label: "Overview", icon: Home, end: true as const },
  { href: "/dashboard/verify", label: "Verify Email", icon: ShieldCheck },
  { href: "/community", label: "Community", icon: Sparkles },
  { href: "/academy", label: "Academy", icon: BookOpen },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Preferences", icon: Settings },
] as const;

const createNav = [
  { href: "/dashboard/generate/image", label: "Image studio", icon: ImageIcon },
  { href: "/dashboard/generate/video", label: "Video studio", icon: Video },
] as const;

const supportNav = [
  { href: "/dashboard/support", label: "Support & Help", icon: Headphones },
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

function SidebarNavLink({
  item,
  pathname,
  onNavigate,
  slimmer = false,
}: {
  item: { href: string; label: string; icon: typeof Home; end?: boolean };
  pathname: string;
  onNavigate?: () => void;
  slimmer?: boolean;
}) {
  const on = navActive(pathname, item.href, "end" in item ? item.end : false);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`group flex items-center rounded-xl border transition-all duration-200 ${slimmer
          ? "min-h-[36px] gap-2 px-2.5 py-1.5 text-xs font-semibold"
          : "min-h-[40px] gap-2.5 px-3 py-2 text-xs sm:text-sm font-semibold"
        }`}
      style={{
        borderColor: on ? "color-mix(in srgb, var(--primary-purple) 42%, var(--border-subtle))" : "var(--border-subtle)",
        background: on ? "color-mix(in srgb, var(--primary-purple) 10%, var(--deep-black))" : "var(--soft-black)",
        color: on ? "var(--text-primary)" : "var(--text-muted)",
        boxShadow: on ? "0 0 14px -3px color-mix(in srgb, var(--primary-purple) 25%, transparent)" : undefined,
      }}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-lg border transition-colors ${slimmer ? "h-7 w-7" : "h-8 w-8"
          }`}
        style={{
          borderColor: "var(--border-subtle)",
          background: on ? "var(--glass)" : "var(--deep-black)",
        }}
      >
        <item.icon className={slimmer ? "h-3.5 w-3.5" : "h-4 w-4"} style={{ color: on ? "var(--primary-cyan)" : undefined }} strokeWidth={1.75} />
      </span>
      <span className="min-w-0 truncate">{item.label}</span>
    </Link>
  );
}

export function UserDashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const reduce = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isVerified = !!user?.emailVerified || user?.verificationStatus === "verified";
  const activeWorkspaceNav = useMemo(
    () => workspaceNav.filter((item) => item.href !== "/dashboard/verify" || !isVerified),
    [isVerified]
  );

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      setMobileOpen(false);
    });
    return () => window.cancelAnimationFrame(id);
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
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:48px_48px] lg:opacity-[0.18]"
        aria-hidden
      />

      <aside
        className="fixed bottom-0 left-0 top-0 z-40 hidden w-[270px] xl:w-[280px] flex-col border-r pt-[env(safe-area-inset-top)] lg:flex"
        style={{
          borderColor: "var(--border-subtle)",
          background: "color-mix(in srgb, var(--rich-black) 96%, transparent)",
          backdropFilter: "blur(16px)",
        }}
      >
        {/* Sidebar Header */}
        <div className="flex h-14 shrink-0 items-center border-b px-4" style={{ borderColor: "var(--border-subtle)" }}>
          <BrandLogo size="md" showWordmark href="/" className="min-w-0" />
        </div>

        {/* Sidebar Body with high-end custom scrollbar */}
        <div className="studio-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto px-3.5 py-4">
          <div>
            <p className="px-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--text-subtle)" }}>
              Workspace
            </p>
            <nav className="mt-2 flex flex-col gap-1.5" aria-label="Workspace">
              {activeWorkspaceNav.map((item) => (
                <SidebarNavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </nav>
          </div>

          <div>
            <p className="px-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--text-subtle)" }}>
              Create
            </p>
            <nav className="mt-2 flex flex-col gap-1.5" aria-label="Create">
              {createNav.map((item) => (
                <SidebarNavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </nav>
          </div>

          <div>
            <p className="px-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--text-subtle)" }}>
              Support
            </p>
            <nav className="mt-2 flex flex-col gap-1.5" aria-label="Support">
              {supportNav.map((item) => (
                <SidebarNavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </nav>
          </div>

          {/* Credits Box Card */}
          <div className="mt-auto rounded-xl border p-3 transition-all duration-300" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
                <Coins className="h-3.5 w-3.5" style={{ color: "var(--primary-cyan)" }} strokeWidth={2} />
                <span>Credits</span>
              </div>
              <Link
                href="/dashboard/billing"
                className="text-xs font-semibold text-[var(--primary-cyan)] transition-opacity hover:opacity-90 hover:underline"
              >
                Billing →
              </Link>
            </div>
            <p className="mt-1.5 text-xs leading-snug" style={{ color: "var(--text-muted)" }}>
              Manage plans and credit balance under billing.
            </p>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="shrink-0 border-t p-3.5 space-y-2.5" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors hover:bg-white/10"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--glass)",
                color: "var(--text-primary)",
              }}
              aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {ready && user ? (
              <div
                className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border py-1 pl-1 pr-2"
                style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, var(--primary-purple), var(--primary-cyan))",
                  }}
                >
                  {initials(user.name)}
                </span>
                <p className="min-w-0 truncate text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                  {user.name}
                </p>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => {
                signOut();
                router.push("/");
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--glass)",
                color: "var(--text-muted)",
              }}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
          <Link
            href="/"
            className="flex min-h-[36px] items-center justify-center gap-2 rounded-xl border text-xs font-semibold transition-colors hover:bg-white/5"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--soft-black)",
              color: "var(--text-muted)",
            }}
          >
            <LayoutDashboard className="h-4 w-4 opacity-80" strokeWidth={1.75} />
            Back to marketing site
          </Link>
        </div>
      </aside>

      <div className="flex min-h-[100dvh] flex-col lg:pl-[260px] xl:pl-[270px]">
        <header
          className="sticky top-0 z-50 border-b pt-[env(safe-area-inset-top)] lg:hidden"
          style={{
            borderColor: "var(--border-subtle)",
            background: "color-mix(in srgb, var(--deep-black) 88%, transparent)",
            backdropFilter: "blur(20px) saturate(160%)",
          }}
        >
          <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
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
              <BrandLogo size="sm" showWordmark href="/" className="min-w-0" />
            </div>

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
                  <div className="min-w-0 max-w-[120px] lg:max-w-[140px]">
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

        <main
          className={
            pathname.startsWith("/dashboard/generate/")
              ? "flex w-full min-h-0 flex-1 flex-col overflow-hidden px-0 pb-0 pt-0"
              : "mx-auto w-full max-w-[1200px] flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-10"
          }
        >
          {/* Verification Banner — shown to unverified users across all dashboard pages */}
          {ready && user && !pathname.startsWith("/dashboard/generate/") && (
            <div className="mb-6">
              <VerificationBanner
                emailVerified={!!user.emailVerified}
                verificationDeadline={user.verificationDeadline ?? null}
                verificationStatus={user.verificationStatus ?? "pending"}
                suspended={!!user.suspended}
              />
            </div>
          )}
          {children}
        </main>
      </div>

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
              className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm lg:hidden"
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
              className="fixed bottom-0 left-0 top-0 z-[60] flex w-[min(100%,320px)] flex-col border-r pt-[env(safe-area-inset-top)] shadow-2xl lg:hidden"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--rich-black)",
              }}
            >
              <div className="flex h-14 shrink-0 items-center justify-between border-b px-4" style={{ borderColor: "var(--border-subtle)" }}>
                <BrandLogo size="sm" showWordmark href="/" onNavigate={() => setMobileOpen(false)} />
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
              <div className="flex flex-1 flex-col gap-8 overflow-y-auto p-4">
                <div>
                  <p className="px-1 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
                    Workspace
                  </p>
                  <nav className="mt-3 flex flex-col gap-1.5" aria-label="Workspace mobile">
                    {activeWorkspaceNav.map((item) => (
                      <SidebarNavLink key={item.href} item={item} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
                    ))}
                  </nav>
                </div>
                <div>
                  <p className="px-1 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
                    Create
                  </p>
                  <nav className="mt-3 flex flex-col gap-1.5" aria-label="Create mobile">
                    {createNav.map((item) => (
                      <SidebarNavLink key={item.href} item={item} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
                    ))}
                  </nav>
                </div>
                <div>
                  <p className="px-1 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
                    Support
                  </p>
                  <nav className="mt-3 flex flex-col gap-1.5" aria-label="Support mobile">
                    {supportNav.map((item) => (
                      <SidebarNavLink key={item.href} item={item} pathname={pathname} onNavigate={() => setMobileOpen(false)} slimmer />
                    ))}
                  </nav>
                </div>
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="mt-auto flex min-h-[48px] items-center justify-center gap-2 rounded-xl border text-sm font-semibold"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--soft-black)",
                    color: "var(--text-muted)",
                  }}
                >
                  <LayoutDashboard className="h-4 w-4" strokeWidth={1.75} />
                  Marketing site
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
