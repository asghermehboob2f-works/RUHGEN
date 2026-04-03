"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, LogOut, Menu, Moon, Sun, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useAuth } from "./AuthProvider";
import { BrandLogo } from "./BrandLogo";
import { useTheme } from "./ThemeProvider";

const SECTION_IDS = [
  "preview",
  "showcase",
  "features",
  "platform",
  "gallery",
  "how",
  "pricing",
  "faq",
] as const;

const links = [
  { href: "#preview", label: "Demo", id: "preview" },
  { href: "#showcase", label: "Spotlight", id: "showcase" },
  { href: "#features", label: "Features", id: "features" },
  { href: "#platform", label: "Platform", id: "platform" },
  { href: "#gallery", label: "Gallery", id: "gallery" },
  { href: "#how", label: "Workflow", id: "how" },
  { href: "#pricing", label: "Pricing", id: "pricing" },
  { href: "#faq", label: "FAQ", id: "faq" },
] as const;

function sectionHref(pathname: string, hash: string) {
  return pathname === "/" ? hash : `/${hash}`;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggle } = useTheme();
  const isLight = theme === "light";
  const onHome = pathname === "/";
  const activeId = useActiveSection(onHome ? SECTION_IDS : []);

  const headerBg = scrolled
    ? isLight
      ? "rgba(255,255,255,0.86)"
      : "rgba(5, 5, 5, 0.72)"
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

  return (
    <>
      <header
        className="fixed left-0 right-0 top-0 z-50 border-b pt-[env(safe-area-inset-top,0px)] transition-[background-color,box-shadow] duration-500"
        style={{
          backgroundColor: headerBg,
          borderColor: "var(--border-subtle)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          boxShadow: scrolled
            ? isLight
              ? "0 12px 40px rgba(0,0,0,0.06)"
              : "0 12px 40px rgba(0,0,0,0.35)"
            : undefined,
        }}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-2 px-3 sm:h-20 sm:gap-3 sm:px-6 lg:px-10">
          <BrandLogo
            size="md"
            showWordmark
            priority
            href="/"
            className="min-w-0 shrink sm:[&_.font-display]:text-xl"
          />

          <nav
            className="hidden max-w-[min(100%,min(calc(100vw-11rem),540px))] items-center gap-0.5 overflow-x-auto rounded-full border px-1 py-1 [scrollbar-width:none] md:flex md:shrink [&::-webkit-scrollbar]:hidden lg:max-w-[min(100%,720px)]"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--glass)",
            }}
            aria-label="Main"
          >
            {links.map((l) => {
              const active = onHome && activeId === l.id;
              return (
                <Link
                  key={l.href}
                  href={sectionHref(pathname, l.href)}
                  className="shrink-0 rounded-full px-2.5 py-2 text-[11px] font-medium transition-colors duration-300 sm:px-3 lg:px-3.5 lg:text-sm"
                  style={{
                    color: active ? "#fff" : "var(--text-muted)",
                    background: active
                      ? "linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)"
                      : "transparent",
                    boxShadow: active
                      ? "0 0 24px rgba(123,97,255,0.35)"
                      : undefined,
                  }}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            {ready && user ? (
              <>
                <Link
                  href="/dashboard"
                  className={`hidden min-h-10 items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold sm:inline-flex lg:px-3 lg:text-sm ${
                    pathname === "/dashboard" ? "border-[#7B61FF]/45 text-[#7B61FF]" : ""
                  }`}
                  style={{
                    borderColor: "var(--border-subtle)",
                    color: pathname === "/dashboard" ? undefined : "var(--text-primary)",
                    background: "var(--glass)",
                  }}
                >
                  <LayoutDashboard className="h-[15px] w-[15px] shrink-0 lg:h-4 lg:w-4" />
                  <span className="max-w-[88px] truncate lg:max-w-[120px]">{user.name}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    router.push("/");
                  }}
                  className="hidden min-h-10 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold sm:inline-flex lg:text-sm"
                  style={{
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-muted)",
                    background: "var(--glass)",
                  }}
                >
                  <LogOut className="h-3.5 w-3.5 shrink-0" />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="hidden min-h-10 items-center rounded-xl border px-3 py-2 text-xs font-semibold sm:inline-flex lg:px-4 lg:text-sm"
                  style={{
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                    background: "var(--glass)",
                  }}
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="hidden min-h-10 items-center rounded-xl px-3 py-2 text-xs font-semibold text-white sm:inline-flex btn-gradient lg:px-4 lg:text-sm"
                >
                  Sign up
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={toggle}
              className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border transition-colors hover:border-[#7B61FF]/45 sm:min-h-10 sm:min-w-10"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
                background: "var(--glass)",
              }}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <Moon className="h-[18px] w-[18px]" />
              )}
            </button>
            <button
              type="button"
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border md:hidden"
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
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/65 backdrop-blur-md"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="absolute right-0 top-0 flex h-full w-[min(100%,min(100vw-2rem),380px)] max-w-full flex-col border-l shadow-2xl"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--soft-black)",
                backdropFilter: "blur(24px)",
                paddingTop: "env(safe-area-inset-top)",
              }}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
            >
              <div
                className="flex items-center justify-between border-b p-4 sm:p-5"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <BrandLogo
                  size="md"
                  showWordmark
                  href="/"
                  onNavigate={() => setOpen(false)}
                  className="min-w-0 shrink sm:[&_.font-display]:text-xl"
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border"
                  style={{
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-3 sm:gap-2 sm:p-4" aria-label="Mobile">
                {links.map((l, i) => (
                  <motion.div
                    key={l.href}
                    initial={{ opacity: 0, x: 28 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * i }}
                  >
                    <Link
                      href={sectionHref(pathname, l.href)}
                      onClick={() => setOpen(false)}
                      className="flex min-h-[48px] items-center justify-center rounded-2xl border px-4 py-3.5 text-center text-[15px] font-medium leading-snug"
                      style={{
                        color: "var(--text-primary)",
                        borderColor: "var(--border-subtle)",
                        background: "var(--glass)",
                      }}
                    >
                      {l.label}
                    </Link>
                  </motion.div>
                ))}
                <div
                  className="mt-2 border-t pt-4"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <p className="px-2 text-center text-[10px] font-bold uppercase tracking-wider sm:px-1" style={{ color: "var(--text-subtle)" }}>
                    Pages
                  </p>
                  <div className="mt-2 flex flex-col gap-1">
                    {[
                      { href: "/about", label: "About" },
                      { href: "/contact", label: "Contact" },
                      { href: "/dashboard", label: "Dashboard" },
                    ].map((x) => (
                      <Link
                        key={x.href}
                        href={x.href}
                        onClick={() => setOpen(false)}
                        className="flex min-h-[44px] items-center justify-center rounded-xl px-4 py-3 text-center text-sm font-medium"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {x.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div
                  className="mt-2 border-t pt-4"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <p className="px-2 text-center text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
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
                        onClick={() => setOpen(false)}
                        className="flex min-h-[44px] items-center justify-center rounded-xl px-4 py-3 text-center text-sm font-medium"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {x.label}
                      </Link>
                    ))}
                    {ready && user ? (
                      <Link
                        href="/dashboard/content"
                        onClick={() => setOpen(false)}
                        className="flex min-h-[44px] items-center justify-center rounded-xl border px-4 py-3 text-center text-sm font-semibold"
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
                </div>
                <div className="mt-3 flex flex-col gap-2 border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}>
                  {ready && user ? (
                    <>
                      <Link
                        href="/dashboard"
                        onClick={() => setOpen(false)}
                        className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border py-3.5 text-sm font-semibold"
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
                          setOpen(false);
                          router.push("/");
                        }}
                        className="min-h-[48px] rounded-2xl border py-3.5 text-sm font-semibold"
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
                      <Link
                        href="/sign-in"
                        onClick={() => setOpen(false)}
                        className="flex min-h-[48px] items-center justify-center rounded-2xl border py-3.5 text-sm font-semibold"
                        style={{
                          borderColor: "var(--border-subtle)",
                          background: "var(--glass)",
                          color: "var(--text-primary)",
                        }}
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/sign-up"
                        onClick={() => setOpen(false)}
                        className="block min-h-[48px] rounded-2xl py-3.5 text-center text-sm font-semibold text-white btn-gradient"
                      >
                        Create account
                      </Link>
                    </>
                  )}
                </div>
                <div className="min-h-4 flex-1" />
                <Link
                  href="/#cta"
                  onClick={() => setOpen(false)}
                  className="mb-2 block min-h-[48px] rounded-2xl py-3.5 text-center text-sm font-semibold text-white btn-gradient"
                >
                  View plans
                </Link>
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
