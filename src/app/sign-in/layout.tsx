import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in — RUHGEN",
  description: "Sign in to your RUHGEN workspace.",
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
