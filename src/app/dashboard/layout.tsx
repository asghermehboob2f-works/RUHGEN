import type { Metadata } from "next";
import { UserDashboardShell } from "@/components/dashboard/UserDashboardShell";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your RUHGEN workspace.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <UserDashboardShell>{children}</UserDashboardShell>;
}
