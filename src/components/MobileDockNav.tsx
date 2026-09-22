"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeDollarSign,
  Home,
  LayoutDashboard,
  Users,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

type DockItem = {
  key: string;
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  match?: "exact" | "prefix";
};

type DockSlot = DockItem | { key: "create-spacer" };

function isActive(pathname: string, item: DockItem) {
  if (item.match === "exact") return pathname === item.href;
  if (item.match === "prefix")
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function MobileDockNav() {
  const pathname = usePathname();
  const { user, ready } = useAuth();

  const dashboardHref = ready && user ? "/dashboard" : "/sign-in";
  const createHref = ready && user ? "/dashboard/generate/image" : "/demo";

  const leftItems: DockItem[] = [
    { key: "home", href: "/", label: "Home", Icon: Home, match: "exact" },
    { key: "community", href: "/community", label: "Community", Icon: Users },
  ];

  const rightItems: DockItem[] = [
    { key: "pricing", href: "/pricing", label: "Pricing", Icon: BadgeDollarSign },
    {
      key: "dashboard",
      href: dashboardHref,
      label: "Dashboard",
      Icon: LayoutDashboard,
      match: "prefix",
    },
  ];

  const slots: DockSlot[] = [
    ...leftItems,
    { key: "create-spacer" },
    ...rightItems,
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 md:hidden pointer-events-none">
      <div
        className="absolute inset-x-0 bottom-0 h-20"
        style={{
          background: "linear-gradient(0deg, var(--header-bg-scrolled) 0%, transparent 100%)",
        }}
      />

      <nav
        aria-label="Elite Navigation"
        className="pointer-events-auto relative mx-auto w-full max-w-[360px] px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex items-center justify-between rounded-full px-2 py-1.5"
          style={{
            background: "var(--drawer-bg)",
            backdropFilter: "blur(40px) saturate(200%)",
            border: "0.5px solid var(--border-subtle)",
            boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.35), inset 0 0.5px 0 var(--border-subtle)",
          }}
        >
          {slots.map((slot) => {
            if (!("href" in slot)) {
              return (
                <div key="center-item" className="flex flex-1 items-center justify-center">
                  <Link
                    href={createHref}
                    aria-label="Create AI Artwork"
                    className="group relative flex items-center justify-center outline-none"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 dark:border-white/15 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm transition-transform duration-200 group-hover:scale-105 active:scale-95">
                      <Wand2 className="h-4 w-4" strokeWidth={2} />
                    </div>
                  </Link>
                </div>
              );
            }

            const on = isActive(pathname, slot);

            return (
              <Link
                key={slot.key}
                href={slot.href}
                className="group relative flex flex-1 flex-col items-center justify-center outline-none"
                aria-current={on ? "page" : undefined}
              >
                <motion.div
                  animate={{
                    y: on ? -1 : 0,
                    scale: on ? 1.05 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                >
                  <slot.Icon 
                    className={`h-[16px] w-[16px] transition-colors duration-500 ${on ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`} 
                    strokeWidth={on ? 2.4 : 1.4} 
                  />
                </motion.div>
                
                <AnimatePresence>
                  {on && (
                    <motion.div
                      layoutId="nav-dot-active"
                      className="mt-0.5 h-0.5 w-0.5 rounded-full bg-[var(--text-primary)] shadow-[0_0_8px_var(--primary-purple)]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </AnimatePresence>

                <span
                  className="mt-0.5 text-[6.5px] font-black uppercase tracking-[0.3em] transition-all duration-500"
                  style={{
                    color: on ? "var(--text-primary)" : "var(--text-muted)",
                    opacity: on ? 1 : 0.9,
                  }}
                >
                  {slot.label}
                </span>
              </Link>
            );
          })}
        </motion.div>
      </nav>
    </div>
  );
}
