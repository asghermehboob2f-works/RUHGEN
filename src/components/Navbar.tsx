"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
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
  { href: "/community", label: "Community", id: "community" },
  { href: "/workflow", label: "Workflow", id: "workflow" },
  { href: "/pricing", label: "Pricing", id: "pricing" },
  { href: "/academy", label: "Academy", id: "academy" },
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
        <div className="mx-auto flex h-14 w-full max-w-[min(100%,1240px)] items-center justify-between gap-2 px-3 sm:h-16 sm:gap-2.5 sm:px-4 md:max-w-[min(100%,1360px)] md:gap-3 md:px-5 lg:max-w-[min(100%,1480px)] lg:gap-3 lg:px-8 xl:max-w-[min(100%,1580px)] xl:px-10 2xl:max-w-[min(100%,1720px)] 2xl:px-12">
          {/* Logo */}
          <div className="flex min-w-0 shrink-0 items-center px-1 py-1">
            <BrandLogo
              size="md"
              showWordmark
              priority
              href="/"
              className="min-w-0 sm:[&_.font-display]:text-xl"
            />
          </div>

          {/* Desktop nav pill bar — flex-1 + min-w-0 so horizontal scroll works between logo and actions */}
          <div className="hidden min-h-0 min-w-0 flex-1 items-center justify-center px-1 md:flex md:px-2">
            <nav
              ref={navRef}
              className="nav-scroll-x max-w-full touch-pan-x overflow-x-auto overscroll-x-contain scroll-smooth rounded-full border px-1.5 py-1 pb-1.5 scroll-px-2.5 snap-x snap-proximity"
              style={{
                borderColor: "var(--border-subtle)",
                background: "rgba(255, 255, 255, 0.03)",
                backdropFilter: "blur(40px) saturate(200%)",
              }}
              aria-label="Main"
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="mx-auto inline-flex w-max min-h-8 items-center gap-0.5 md:min-h-9 md:gap-0.5 lg:gap-0">
                {desktopItems.map((item) => {
                  if (item.kind === "sep") {
                    return (
                      <span
                        key={item.id}
                        className="mx-0.5 h-3.5 w-px shrink-0 md:mx-1 lg:mx-1.5"
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
                      className="relative shrink-0 snap-start rounded-full px-1.5 py-1 text-[10px] font-medium md:px-2.5 md:py-1.5 md:text-[11px] lg:px-3 lg:text-[12px]"
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
                        className="relative z-[1] inline-flex whitespace-nowrap"
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
              </div>
            </nav>
          </div>

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
                    className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors duration-200 lg:px-3 lg:text-sm ${
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
                  className="hidden min-h-9 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors duration-200 hover:border-[#7B61FF]/30 sm:inline-flex lg:text-sm"
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
                    className="inline-flex min-h-9 items-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors duration-200 hover:border-[#7B61FF]/30 lg:px-3.5 lg:text-sm"
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
                    className="inline-flex min-h-9 items-center rounded-lg px-3 py-1.5 text-xs font-semibold text-white btn-gradient lg:px-3.5 lg:text-sm"
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
              className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors duration-200 hover:border-[#7B61FF]/35"
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
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-transform active:scale-[0.97] md:hidden"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
                background: "var(--glass)",
              }}
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile drawer — lightweight: short tween slide, no blur, no staggered list motion */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/50 dark:bg-black/65 backdrop-blur-sm"
              aria-label="Close menu"
              onClick={closeMobile}
            />

            <motion.aside
              className="absolute right-0 top-0 flex h-full min-h-0 w-[300px] max-w-[85vw] flex-col border-l shadow-2xl"
              style={{
                borderColor: "var(--border-subtle)",
                background: isLight ? "rgba(244, 244, 248, 0.95)" : "rgba(10, 10, 12, 0.95)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                paddingTop: "env(safe-area-inset-top)",
                willChange: "transform",
              }}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
            >
              <div
                className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5 sm:px-5 sm:py-3"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <BrandLogo
                  size="md"
                  showWordmark
                  href="/"
                  onNavigate={closeMobile}
                  className="min-w-0 shrink sm:[&_.font-display]:text-xl"
                />
                <button
                  type="button"
                  onClick={closeMobile}
                  className="flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-lg border transition-transform active:scale-[0.97]"
                  style={{
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                    background: "var(--glass)",
                  }}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav
                className="nav-scroll-y flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-y-contain px-4 pt-2.5 sm:px-5 sm:pt-3"
                aria-label="Mobile"
              >
                <div className="flex flex-col gap-px">
                  {links.map((l) => {
                    const isActive = pathname === l.href;
                    return (
                      <Link
                        key={l.href}
                        href={l.href}
                        onClick={closeMobile}
                        prefetch
                        onFocus={() => prefetchIfInternal(l.href)}
                        className="flex min-h-10 items-center rounded-lg px-3 py-2 text-left text-[15px] font-medium leading-snug transition-colors active:opacity-90 sm:px-3.5"
                        style={{
                          color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                          background: isActive
                            ? isLight ? "rgba(123, 97, 255, 0.1)" : "rgba(123, 97, 255, 0.12)"
                            : "transparent",
                        }}
                      >
                        {l.label}
                      </Link>
                    );
                  })}
                </div>

                <div
                  className="mt-4 border-t pt-4"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <p
                    className="px-3 pb-2 text-left text-[10px] font-bold uppercase tracking-[0.16em] sm:px-3.5"
                    style={{ color: "var(--text-subtle)" }}
                  >
                    Pages
                  </p>
                  <div className="flex flex-col gap-px">
                    {[
                      { href: "/about", label: "About" },
                      { href: "/contact", label: "Contact" },
                    ].map((x) => (
                      <Link
                        key={x.href}
                        href={x.href}
                        onClick={closeMobile}
                        prefetch
                        onFocus={() => prefetchIfInternal(x.href)}
                        className="flex min-h-9 items-center rounded-lg px-3 py-1.5 text-left text-sm font-medium leading-snug transition-colors active:bg-[var(--glass-elevated)] sm:px-3.5"
                        style={{
                          color:
                            pathname === x.href
                              ? "#7B61FF"
                              : "var(--text-muted)",
                        }}
                      >
                        {x.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div
                  className="mt-3 border-t pt-4"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <p
                    className="px-3 pb-2 text-left text-[10px] font-bold uppercase tracking-[0.16em] sm:px-3.5"
                    style={{ color: "var(--text-subtle)" }}
                  >
                    More
                  </p>
                  <div className="flex flex-col gap-px">
                    {[
                      { href: "/privacy", label: "Privacy" },
                      { href: "/terms", label: "Terms" },
                    ].map((x) => (
                      <Link
                        key={x.href + x.label}
                        href={x.href}
                        onClick={closeMobile}
                        prefetch={x.href.startsWith("/")}
                        onFocus={() => prefetchIfInternal(x.href)}
                        className="flex min-h-9 items-center rounded-lg px-3 py-1.5 text-left text-sm font-medium leading-snug transition-colors active:bg-[var(--glass-elevated)] sm:px-3.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {x.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="h-6 shrink-0" />
              </nav>

              {/* Sticky Footer */}
              <div
                className="flex shrink-0 flex-col gap-2.5 border-t px-4 py-3 pb-[max(0.875rem,env(safe-area-inset-bottom))]"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: isLight ? "rgba(240, 240, 245, 0.6)" : "rgba(8, 8, 10, 0.6)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                }}
              >
                {ready && user ? (
                  <div className="flex gap-2">
                    <Link
                      href="/dashboard"
                      onClick={closeMobile}
                      prefetch
                      onFocus={() => prefetchIfInternal("/dashboard")}
                      className="flex-1 flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors"
                      style={{
                        borderColor: "var(--border-subtle)",
                        background: "var(--glass-elevated)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        signOut();
                        closeMobile();
                        router.push("/");
                      }}
                      className="flex-1 min-h-10 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors"
                      style={{
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-muted)",
                        background: "transparent",
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      href="/sign-in"
                      onClick={closeMobile}
                      prefetch
                      onFocus={() => prefetchIfInternal("/sign-in")}
                      className="flex-1 flex min-h-10 items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold transition-colors"
                      style={{
                        borderColor: "var(--border-subtle)",
                        background: "var(--glass-elevated)",
                        color: "var(--text-primary)",
                      }}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/sign-up"
                      onClick={closeMobile}
                      prefetch
                      onFocus={() => prefetchIfInternal("/sign-up")}
                      className="flex-1 flex min-h-10 items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold text-white btn-gradient"
                    >
                      Create account
                    </Link>
                  </div>
                )}

                <Link
                  href="/#cta"
                  onClick={closeMobile}
                  className="flex min-h-10 w-full items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold text-white btn-gradient"
                >
                  View plans
                </Link>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
