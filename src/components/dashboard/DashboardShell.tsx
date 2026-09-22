"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  Calculator,
  Coins,
  CreditCard,
  DollarSign,
  ExternalLink,
  GraduationCap,
  Headphones,
  HelpCircle,
  History,
  Inbox,
  Layers,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Moon,
  PanelLeft,
  Search,
  Settings,
  ShieldCheck,
  Sliders,
  Sparkles,
  Sun,
  Users,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { AmbientBackdrop } from "@/components/AmbientBackdrop";
import { BrandLogo } from "@/components/BrandLogo";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { CursorGlow } from "@/components/CursorGlow";

interface NavItem {
  href: string;
  label: string;
  icon: any;
  end?: boolean;
  isSubItem?: boolean;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "MAIN WORKSPACE",
    items: [
      { href: "/admindashboard", label: "Overview", icon: LayoutDashboard, end: true },
      { href: "/admindashboard/analytics", label: "Analytics & Audits", icon: Activity },
    ],
  },
  {
    title: "CREDITS & AI ENGINE",
    items: [
      { href: "/admindashboard/credits?tab=overview", label: "Financial Overview", icon: LayoutDashboard, isSubItem: true },
      { href: "/admindashboard/credits?tab=rates", label: "Model Rate Matrix", icon: Coins, isSubItem: true, badge: "Sync" },
      { href: "/admindashboard/credits?tab=models", label: "AI Model Registry", icon: Layers, isSubItem: true },
      { href: "/admindashboard/credits?tab=economics", label: "Platform Economics", icon: DollarSign, isSubItem: true },
      { href: "/admindashboard/credits?tab=simulator", label: "Margin Simulator", icon: Calculator, isSubItem: true },
      { href: "/admindashboard/credits?tab=adjustments", label: "Adjustments & Ledger", icon: History, isSubItem: true },
    ],
  },
  {
    title: "USERS & OPERATIONS",
    items: [
      { href: "/admindashboard/users", label: "User Accounts", icon: Users },
      { href: "/admindashboard/verification", label: "Email Verification", icon: ShieldCheck },
    ],
  },
  {
    title: "FINANCIALS & REVENUE",
    items: [
      { href: "/admindashboard/payments", label: "Payments & Orders", icon: CreditCard },
    ],
  },
  {
    title: "SUPPORT & INBOX",
    items: [
      { href: "/admindashboard/support", label: "Support Desk", icon: Headphones },
      { href: "/admindashboard/messages", label: "Contact Inbox", icon: Inbox },
      { href: "/admindashboard/subscribers", label: "Newsletter List", icon: Mail },
    ],
  },
  {
    title: "CONTENT MANAGEMENT",
    items: [
      { href: "/admindashboard/content", label: "Site Content Studio", icon: Layers },
      { href: "/admindashboard/spotlight", label: "Spotlight CMS", icon: Sparkles },
      { href: "/admindashboard/academy", label: "Academy CMS", icon: GraduationCap },
      { href: "/admindashboard/faq", label: "FAQ Manager", icon: HelpCircle },
    ],
  },
  {
    title: "SYSTEM SETTINGS",
    items: [
      { href: "/admindashboard/settings", label: "Admin Settings", icon: Settings },
    ],
  },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase();
}

function isNavActive(currentPath: string, currentQueryTab: string | null, targetHref: string, end?: boolean) {
  const [targetPath, targetQuery] = targetHref.split("?");
  
  if (targetQuery) {
    const params = new URLSearchParams(targetQuery);
    const expectedTab = params.get("tab");
    if (expectedTab) {
      return currentPath === targetPath && (currentQueryTab === expectedTab || (!currentQueryTab && expectedTab === "overview"));
    }
  }

  if (end) {
    return currentPath === targetPath && (!targetQuery || !currentQueryTab);
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

function NavLinksList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get("tab") || null;
  const [searchFilter, setSearchFilter] = useState("");

  const filteredGroups = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return navGroups;

    return navGroups
      .map((group) => {
        const matchingItems = group.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            group.title.toLowerCase().includes(q) ||
            item.href.toLowerCase().includes(q)
        );
        return {
          ...group,
          items: matchingItems,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [searchFilter]);

  return (
    <nav className="flex flex-col gap-4" aria-label="Workspace Navigation">
      {/* Quick Search Controls Filter */}
      <div className="relative px-1">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[var(--text-subtle)]" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Quick find control..."
            className="w-full rounded-xl border py-1.5 pl-8 pr-7 text-[11px] font-medium transition-all outline-none focus:border-[#7B61FF]/60 placeholder:text-[var(--text-subtle)]"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--deep-black)",
              color: "var(--text-primary)",
            }}
          />
          {searchFilter && (
            <button
              type="button"
              onClick={() => setSearchFilter("")}
              className="absolute right-2.5 text-xs text-[var(--text-subtle)] hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {filteredGroups.map((group) => (
        <div key={group.title} className="space-y-1">
          <p className="px-3 text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
            {group.title}
          </p>
          <div className="space-y-1 pt-0.5">
            {group.items.map((item) => {
              const isOn = isNavActive(pathname, currentTab, item.href, item.end);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`group flex items-center gap-2.5 rounded-xl border transition-all ${
                    item.isSubItem
                      ? "min-h-[34px] ml-2.5 px-2.5 py-1.5 text-[11px]"
                      : "min-h-[40px] px-3 py-1.5 text-xs font-semibold"
                  }`}
                  style={{
                    borderColor: isOn ? "color-mix(in srgb, #7B61FF 40%, transparent)" : "var(--border-subtle)",
                    background: isOn ? "color-mix(in srgb, #7B61FF 12%, var(--deep-black))" : "var(--soft-black)",
                    color: isOn ? "#00D4FF" : item.isSubItem ? "var(--text-muted)" : "var(--text-primary)",
                  }}
                >
                  <span
                    className={`flex shrink-0 items-center justify-center rounded-lg transition-colors ${
                      item.isSubItem ? "h-5 w-5" : "h-6 w-6"
                    } ${
                      isOn
                        ? "border border-[#7B61FF]/40 bg-[#7B61FF]/20 text-[#00D4FF]"
                        : "border border-[var(--border-subtle)] bg-[var(--deep-black)] text-[var(--text-subtle)] group-hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <item.icon className={item.isSubItem ? "h-3 w-3" : "h-3.5 w-3.5"} strokeWidth={item.isSubItem ? 1.6 : 1.8} />
                  </span>
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto rounded px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {filteredGroups.length === 0 && (
        <div className="py-6 text-center text-xs text-[var(--text-subtle)]">
          No controls matching &quot;{searchFilter}&quot;
        </div>
      )}

      <div className="pt-2 border-t space-y-1.5" style={{ borderColor: "var(--border-subtle)" }}>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="group flex min-h-[40px] items-center gap-3 rounded-xl border px-3 py-2 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--deep-black)]">
            <LayoutDashboard className="h-3.5 w-3.5" strokeWidth={1.8} />
          </span>
          User Studio Workspace
        </Link>

        <Link
          href="/"
          onClick={onNavigate}
          className="flex min-h-[40px] items-center gap-3 rounded-xl border px-3 py-2 text-xs font-semibold text-[var(--text-subtle)] transition-colors hover:text-[var(--text-primary)]"
          style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--deep-black)]">
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.8} />
          </span>
          Public Website
        </Link>
      </div>
    </nav>
  );
}

function DashboardNavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <Suspense fallback={<div className="p-3 text-xs text-[var(--text-subtle)]">Loading controls...</div>}>
      <NavLinksList pathname={pathname} onNavigate={onNavigate} />
    </Suspense>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, ready, logout } = useAdminAuth();
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
    const id = window.requestAnimationFrame(() => {
      setMobileNav(false);
    });
    return () => window.cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <>
      <AmbientBackdrop />
      <CursorGlow />
      <div className="app-grain fixed inset-0 z-[5]" aria-hidden />

      <div className="relative z-10 min-h-[100dvh]">
        {/* Desktop sidebar */}
        <aside
          className="dashboard-sidebar-rail fixed bottom-0 left-0 top-0 z-40 hidden w-[270px] flex-col border-r pt-[env(safe-area-inset-top)] lg:flex"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--rich-black)",
          }}
        >
          <div className="flex h-[4.25rem] items-center border-b px-5" style={{ borderColor: "var(--border-subtle)" }}>
            <BrandLogo size="md" showWordmark href="/" className="min-w-0" />
            <span className="ml-auto rounded-full border border-[#7B61FF]/40 bg-[#7B61FF]/10 px-2 py-0.5 text-[9px] font-extrabold text-[#00D4FF]">
              ADMIN
            </span>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
            <DashboardNavLinks pathname={pathname} />
          </div>
        </aside>

        {/* Top bar + main */}
        <div className="flex min-h-[100dvh] flex-1 flex-col lg:pl-[270px]">
          <header
            className="sticky top-0 z-30 flex h-[4.25rem] items-center justify-between gap-3 border-b px-3 pt-[env(safe-area-inset-top)] sm:px-6"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--deep-black)",
            }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border lg:hidden"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--glass)",
                  color: "var(--text-primary)",
                }}
                aria-expanded={mobileNav}
                aria-controls="dashboard-mobile-nav"
                onClick={() => setMobileNav(true)}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </button>
              <div className="hidden items-center gap-2 text-[var(--text-subtle)] lg:flex">
                <PanelLeft className="h-4 w-4 opacity-60" strokeWidth={1.75} />
                <span className="text-xs font-bold uppercase tracking-[0.14em]">RUHGEN Admin Console</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={toggle}
                className="flex h-9 w-9 items-center justify-center rounded-xl border transition-colors"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--soft-black)",
                  color: "var(--text-primary)",
                }}
                aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {ready && admin && (
                <div
                  className="hidden max-w-[220px] items-center gap-2 rounded-xl border py-1.5 pl-2 pr-3 sm:flex"
                  style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{
                      background: "linear-gradient(135deg, #7B61FF, #00D4FF)",
                    }}
                  >
                    {initials(admin.name || admin.email)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                      {admin.name || admin.email?.split("@")[0] || "Operator"}
                    </p>
                    <p className="truncate font-mono text-[10px]" style={{ color: "var(--text-subtle)" }}>
                      {admin.email}
                    </p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={async () => {
                  await logout();
                  router.push("/admin/login");
                }}
                className="flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--soft-black)",
                  color: "var(--text-muted)",
                }}
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
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
            RUHGEN Operator Console & Architecture Suite
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
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
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
                className="fixed bottom-0 left-0 top-0 z-50 flex w-[min(100%,280px)] flex-col border-r pt-[env(safe-area-inset-top)] shadow-2xl lg:hidden"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--rich-black)",
                }}
              >
                <div className="flex h-[4.25rem] items-center justify-between border-b px-4" style={{ borderColor: "var(--border-subtle)" }}>
                  <BrandLogo size="sm" showWordmark href="/" />
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border"
                    style={{
                      borderColor: "var(--border-subtle)",
                      background: "var(--glass)",
                      color: "var(--text-primary)",
                    }}
                    onClick={() => setMobileNav(false)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-3 py-4">
                  <DashboardNavLinks pathname={pathname} onNavigate={() => setMobileNav(false)} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
