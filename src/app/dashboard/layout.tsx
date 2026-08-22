import type { Metadata } from "next";
import { UserDashboardShell } from "@/components/dashboard/UserDashboardShell";

export const metadata: Metadata = {
  title: "Dashboard — RUHGEN",
  description: "Your RUHGEN workspace.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <UserDashboardShell>{children}</UserDashboardShell>;
}
