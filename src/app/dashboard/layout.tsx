import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — RUHGEN",
  description: "Your RUHGEN workspace.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
