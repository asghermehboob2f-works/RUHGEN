import type { Metadata } from "next";
import { MarketingShell } from "@/components/MarketingShell";
import { NotFoundView } from "@/components/not-found/NotFoundView";

export const metadata: Metadata = {
  title: "404 — Nothing Here",
  description: "The requested page doesn't exist on RUHGEN. Explore valid platform routes or return home.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <MarketingShell hideFooter>
      <NotFoundView />
    </MarketingShell>
  );
}
