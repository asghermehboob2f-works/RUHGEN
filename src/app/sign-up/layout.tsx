import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create account — RUHGEN",
  description: "Create your RUHGEN workspace — free tier included.",
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
