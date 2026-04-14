"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { BrandLogo } from "./BrandLogo";
import { useTheme } from "./ThemeProvider";

const links = [
  { href: "/demo", label: "Demo", id: "demo" },
  { href: "/spotlight", label: "Spotlight", id: "spotlight" },
  { href: "/features", label: "Features", id: "features" },
  { href: "/platform", label: "Platform", id: "platform" },
  { href: "/gallery", label: "Gallery", id: "gallery" },
  { href: "/workflow", label: "Workflow", id: "workflow" },
  { href: "/pricing", label: "Pricing", id: "pricing" },
  { href: "/faq", label: "FAQ", id: "faq" },
] as const;

type DesktopNavItem =
  | {
      kind: "section";
      href: string;
      label: string;
      id: string;
    }
  | { kind: "page"; href: string; label: string; id: string }
  | { kind: "sep"; label: string; id: string };

function NavPill({
  active,
  layoutId,
}: {
  active: boolean;
  layoutId: string;
}) {
  if (!active) return null;
  return (
    <motion.span
      layoutId={layoutId}
      className="absolute inset-0 z-0 rounded-full"
      style={{
        background: "linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)",
        boxShadow: "0 0 20px rgba(123,97,255,0.3), 0 0 40px rgba(0,212,255,0.12)",
      }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
    />
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const { theme, toggle } = useTheme();
  const isLight = theme === "light";
  const navRef = useRef<HTMLElement>(null);

  const desktopItems: readonly DesktopNavItem[] = [
    ...links.map((l) => ({ kind: "section" as const, ...l })),
    { kind: "sep", label: "", id: "sep-pages" },
    { kind: "page", href: "/about", label: "About", id: "about" },
    { kind: "page", href: "/contact", label: "Contact", id: "contact" },
  ] as const;

  const prefetchIfInternal = useCallback(
    (href: string) => {
      if (href.startsWith("/")) router.prefetch(href);
    },
    [router]
  );

  const headerBg = scrolled
    ? isLight
      ? "rgba(255,255,255,0.88)"
      : "rgba(5, 5, 5, 0.78)"
    : isLight
      ? "rgba(255,255,255,0.55)"
      : "rgba(5, 5, 5, 0.35)";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const closeMobile = useCallback(() => setOpen(false), []);

  return (
    <>
      <motion.header
        className="fixed left-0 right-0 top-0 z-50 border-b pt-[env(safe-area-inset-top,0px)]"
        style={{
          borderColor: "var(--border-subtle)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
        }}
        animate={{
          backgroundColor: headerBg,
          boxShadow: scrolled
            ? isLight
              ? "0 8px 32px rgba(0,0,0,0.06)"
              : "0 8px 32px rgba(0,0,0,0.35)"
            : "0 0px 0px rgba(0,0,0,0)",
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="mx-auto flex h-16 max-w-[min(100%,1240px)] items-center justify-between gap-2 px-3 sm:h-[72px] sm:gap-3 sm:px-5 md:max-w-[min(100%,1320px)] md:px-6 lg:max-w-[1400px] lg:px-10">
          {/* Logo */}
          <div className="flex shrink-0 items-center px-1 py-1">
            <BrandLogo
              size="md"
              showWordmark
              priority
              href="/"
              className="min-w-0 sm:[&_.font-display]:text-xl"
            />
          </div>

          {/* Desktop nav pill bar */}
          <nav
            ref={navRef}
            className="hidden w-fit max-w-[min(100%,min(calc(100vw-18.5rem),860px))] items-center gap-0.5 overflow-x-auto rounded-full border px-1 py-1 [scrollbar-width:none] md:flex md:gap-0.5 lg:gap-0 [&::-webkit-scrollbar]:hidden"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--glass)",
            }}
            aria-label="Main"
            onMouseLeave={() => setHoveredId(null)}
          >
            {desktopItems.map((item) => {
              if (item.kind === "sep") {
                return (
                  <span
                    key={item.id}
                    className="mx-1 h-4 w-px shrink-0 lg:mx-1.5"
                    style={{ background: "var(--border-subtle)" }}
                    aria-hidden
                  />
                );
              }

              const active =
                item.kind === "section"
                  ? pathname === item.href
                  : pathname === item.href;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  prefetch
                  className="relative shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-medium md:px-3 md:py-2 md:text-[11px] lg:px-3.5 lg:text-[13px]"
                  aria-current={active ? "page" : undefined}
                  onMouseEnter={() => {
                    setHoveredId(item.id);
                    prefetchIfInternal(item.href);
                  }}
                  onFocus={() => prefetchIfInternal(item.href)}
                  style={{
                    color: active ? "#fff" : "var(--text-muted)",
                  }}
                >
                  <NavPill active={active} layoutId="nav-active-pill" />

                  {/* Hover glow */}
                  <AnimatePresence>
                    {hoveredId === item.id && !active && (
                      <motion.span
                        className="absolute inset-0 z-0 rounded-full"
                        style={{
                          background: isLight
                            ? "rgba(123,97,255,0.07)"
                            : "rgba(123,97,255,0.1)",
                        }}
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.92 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </AnimatePresence>

                  <motion.span
                    className="relative z-[1] inline-flex"
                    animate={{
                      color: active
                        ? "#fff"
                        : hoveredId === item.id
                          ? "var(--text-primary)"
                          : "var(--text-muted)",
                    }}
                    transition={{ duration: 0.2 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    {item.label}
                  </motion.span>
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {ready && user ? (
              <>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="hidden sm:block"
                >
                  <Link
                    href="/dashboard"
                    className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors duration-200 lg:px-3.5 lg:text-sm ${
                      pathname === "/dashboard" ||
                      pathname.startsWith("/dashboard/")
                        ? "border-[#7B61FF]/40"
                        : ""
                    }`}
                    style={{
                      borderColor:
                        pathname === "/dashboard" ||
                        pathname.startsWith("/dashboard/")
                          ? undefined
                          : "var(--border-subtle)",
                      color:
                        pathname === "/dashboard" ||
                        pathname.startsWith("/dashboard/")
                          ? "#7B61FF"
                          : "var(--text-primary)",
                      background: "var(--glass)",
                    }}
                  >
                    <LayoutDashboard className="h-[15px] w-[15px] shrink-0 lg:h-4 lg:w-4" />
                    <span className="max-w-[88px] truncate lg:max-w-[120px]">
                      {user.name}
                    </span>
                  </Link>
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => {
                    signOut();
                    router.push("/");
                  }}
                  className="hidden min-h-10 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors duration-200 hover:border-[#7B61FF]/30 sm:inline-flex lg:text-sm"
                  style={{
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-muted)",
                    background: "var(--glass)",
                  }}
                >
                  <LogOut className="h-3.5 w-3.5 shrink-0" />
                  Log out
                </motion.button>
              </>
            ) : (
              <>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="hidden sm:block"
                >
                  <Link
                    href="/sign-in"
                    className="inline-flex min-h-10 items-center rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors duration-200 hover:border-[#7B61FF]/30 lg:px-4 lg:text-sm"
                    style={{
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-primary)",
                      background: "var(--glass)",
                    }}
                  >
                    Sign in
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="hidden sm:block"
                >
                  <Link
                    href="/sign-up"
                    className="inline-flex min-h-10 items-center rounded-xl px-3.5 py-2 text-xs font-semibold text-white btn-gradient lg:px-4 lg:text-sm"
                  >
                    Get started
                  </Link>
                </motion.div>
              </>
            )}

            {/* Theme toggle */}
            <motion.button
              type="button"
              onClick={toggle}
              className="flex h-10 w-10 items-center justify-center rounded-xl border transition-colors duration-200 hover:border-[#7B61FF]/35"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
                background: "var(--glass)",
              }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === "dark" ? (
                  <motion.span
                    key="sun"
                    initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="flex items-center justify-center"
                  >
                    <Sun className="h-[18px] w-[18px]" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="moon"
                    initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="flex items-center justify-center"
                  >
                    <Moon className="h-[18px] w-[18px]" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Mobile menu button */}
            <motion.button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-xl border md:hidden"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
                background: "var(--glass)",
              }}
              onClick={() => setOpen(true)}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Backdrop */}
            <motion.button
              type="button"
              className="absolute inset-0"
              style={{
                background: isLight
                  ? "rgba(0,0,0,0.35)"
                  : "rgba(0,0,0,0.65)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
              aria-label="Close menu"
              onClick={closeMobile}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Panel */}
            <motion.aside
              className="absolute right-0 top-0 flex h-full w-[min(100%,min(100vw-2rem),380px)] max-w-full flex-col border-l shadow-2xl"
              style={{
                borderColor: "var(--border-subtle)",
                background: isLight
                  ? "rgba(250,250,252,0.97)"
                  : "rgba(12,12,14,0.97)",
                backdropFilter: "blur(32px) saturate(180%)",
                WebkitBackdropFilter: "blur(32px) saturate(180%)",
                paddingTop: "env(safe-area-inset-top)",
              }}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              {/* Drawer header */}
              <div
                className="flex items-center justify-between border-b p-4 sm:p-5"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <BrandLogo
                  size="md"
                  showWordmark
                  href="/"
                  onNavigate={closeMobile}
                  className="min-w-0 shrink sm:[&_.font-display]:text-xl"
                />
                <motion.button
                  type="button"
                  onClick={closeMobile}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                    background: "var(--glass)",
                  }}
                  whileHover={{ scale: 1.06, rotate: 90 }}
                  whileTap={{ scale: 0.94 }}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>

              {/* Drawer body */}
              <nav
                className="flex flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain p-3 sm:gap-2 sm:p-4"
                aria-label="Mobile"
              >
                {/* Section links */}
                {links.map((l, i) => {
                  const isActive = pathname === l.href;
                  return (
                    <motion.div
                      key={l.href}
                      initial={{ opacity: 0, x: 32, filter: "blur(4px)" }}
                      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                      transition={{
                        delay: 0.03 * i,
                        duration: 0.35,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                    >
                      <Link
                        href={l.href}
                        onClick={closeMobile}
                        prefetch
                        onMouseEnter={() => prefetchIfInternal(l.href)}
                        onFocus={() => prefetchIfInternal(l.href)}
                        className="group relative flex min-h-[48px] items-center justify-between rounded-2xl border px-4 py-3.5 text-[15px] font-medium leading-snug transition-colors duration-200"
                        style={{
                          color: isActive ? "#fff" : "var(--text-primary)",
                          borderColor: isActive
                            ? "rgba(123,97,255,0.3)"
                            : "var(--border-subtle)",
                          background: isActive
                            ? "linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)"
                            : "var(--glass)",
                        }}
                      >
                        <span>{l.label}</span>
                        <ChevronRight
                          className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                          style={{
                            color: isActive ? "rgba(255,255,255,0.7)" : "var(--text-subtle)",
                          }}
                        />
                      </Link>
                    </motion.div>
                  );
                })}

                {/* Page links */}
                <motion.div
                  className="mt-3 border-t pt-4"
                  style={{ borderColor: "var(--border-subtle)" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <p
                    className="px-2 text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: "var(--text-subtle)" }}
                  >
                    Pages
                  </p>
                  <div className="mt-2 flex flex-col gap-1">
                    {[
                      { href: "/about", label: "About" },
                      { href: "/platform", label: "Platform" },
                      { href: "/contact", label: "Contact" },
                      { href: "/dashboard", label: "Dashboard" },
                    ].map((x) => (
                      <Link
                        key={x.href}
                        href={x.href}
                        onClick={closeMobile}
                        prefetch
                        onMouseEnter={() => prefetchIfInternal(x.href)}
                        onFocus={() => prefetchIfInternal(x.href)}
                        className="group flex min-h-[44px] items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200 hover:bg-[var(--glass-elevated)]"
                        style={{
                          color:
                            pathname === x.href
                              ? "#7B61FF"
                              : "var(--text-muted)",
                        }}
                      >
                        <span>{x.label}</span>
                        <ChevronRight
                          className="h-3.5 w-3.5 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                          style={{ color: "var(--text-subtle)" }}
                        />
                      </Link>
                    ))}
                  </div>
                </motion.div>

                {/* More links */}
                <motion.div
                  className="mt-2 border-t pt-4"
                  style={{ borderColor: "var(--border-subtle)" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                >
                  <p
                    className="px-2 text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: "var(--text-subtle)" }}
                  >
                    More
                  </p>
                  <div className="mt-2 flex flex-col gap-1">
                    {[
                      { href: "/privacy", label: "Privacy" },
                      { href: "/terms", label: "Terms" },
                      { href: "/#faq", label: "FAQ" },
                    ].map((x) => (
                      <Link
                        key={x.href + x.label}
                        href={x.href}
                        onClick={closeMobile}
                        prefetch={x.href.startsWith("/")}
                        onMouseEnter={() => prefetchIfInternal(x.href)}
                        onFocus={() => prefetchIfInternal(x.href)}
                        className="group flex min-h-[44px] items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200 hover:bg-[var(--glass-elevated)]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <span>{x.label}</span>
                        <ChevronRight
                          className="h-3.5 w-3.5 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                          style={{ color: "var(--text-subtle)" }}
                        />
                      </Link>
                    ))}
                    {ready && user ? (
                      <Link
                        href="/dashboard/content"
                        onClick={closeMobile}
                        prefetch
                        onMouseEnter={() => prefetchIfInternal("/dashboard/content")}
                        onFocus={() => prefetchIfInternal("/dashboard/content")}
                        className="flex min-h-[44px] items-center justify-center rounded-xl border px-4 py-3 text-center text-sm font-semibold transition-colors duration-200"
                        style={{
                          borderColor: "var(--border-subtle)",
                          background: "var(--glass)",
                          color: "var(--text-primary)",
                        }}
                      >
                        Site content
                      </Link>
                    ) : null}
                  </div>
                </motion.div>

                {/* Auth section */}
                <motion.div
                  className="mt-3 flex flex-col gap-2 border-t pt-4"
                  style={{ borderColor: "var(--border-subtle)" }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {ready && user ? (
                    <>
                      <Link
                        href="/dashboard"
                        onClick={closeMobile}
                        prefetch
                        onMouseEnter={() => prefetchIfInternal("/dashboard")}
                        onFocus={() => prefetchIfInternal("/dashboard")}
                        className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border py-3.5 text-sm font-semibold transition-colors duration-200"
                        style={{
                          borderColor: "var(--border-subtle)",
                          background: "var(--glass)",
                          color: "var(--text-primary)",
                        }}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          signOut();
                          closeMobile();
                          router.push("/");
                        }}
                        className="min-h-[48px] rounded-2xl border py-3.5 text-sm font-semibold transition-colors duration-200"
                        style={{
                          borderColor: "var(--border-subtle)",
                          color: "var(--text-muted)",
                          background: "transparent",
                        }}
                      >
                        Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          href="/sign-in"
                          onClick={closeMobile}
                          prefetch
                          onMouseEnter={() => prefetchIfInternal("/sign-in")}
                          onFocus={() => prefetchIfInternal("/sign-in")}
                          className="flex min-h-[48px] items-center justify-center rounded-2xl border py-3.5 text-sm font-semibold transition-colors duration-200"
                          style={{
                            borderColor: "var(--border-subtle)",
                            background: "var(--glass)",
                            color: "var(--text-primary)",
                          }}
                        >
                          Sign in
                        </Link>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          href="/sign-up"
                          onClick={closeMobile}
                          prefetch
                          onMouseEnter={() => prefetchIfInternal("/sign-up")}
                          onFocus={() => prefetchIfInternal("/sign-up")}
                          className="block min-h-[48px] rounded-2xl py-3.5 text-center text-sm font-semibold text-white btn-gradient"
                        >
                          Create account
                        </Link>
                      </motion.div>
                    </>
                  )}
                </motion.div>

                <div className="min-h-4 flex-1" />

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="mb-2"
                >
                  <Link
                    href="/#cta"
                    onClick={closeMobile}
                    className="block min-h-[48px] rounded-2xl py-3.5 text-center text-sm font-semibold text-white btn-gradient"
                  >
                    View plans
                  </Link>
                </motion.div>
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
