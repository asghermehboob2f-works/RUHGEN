import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "https://ruhgen.com").replace(/\/$/, "");
  const lastModified = new Date();

  const publicRoutes = [
    { route: "", priority: 1.0, changeFrequency: "daily" as const },
    { route: "/features", priority: 0.9, changeFrequency: "weekly" as const },
    { route: "/pricing", priority: 0.9, changeFrequency: "weekly" as const },
    { route: "/academy", priority: 0.8, changeFrequency: "weekly" as const },
    { route: "/tutorials", priority: 0.8, changeFrequency: "weekly" as const },
    { route: "/spotlight", priority: 0.8, changeFrequency: "weekly" as const },
    { route: "/workflow", priority: 0.8, changeFrequency: "monthly" as const },
    { route: "/community", priority: 0.7, changeFrequency: "daily" as const },
    { route: "/about", priority: 0.7, changeFrequency: "monthly" as const },
    { route: "/faq", priority: 0.7, changeFrequency: "monthly" as const },
    { route: "/contact", priority: 0.6, changeFrequency: "monthly" as const },
    { route: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
    { route: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
  ];

  return publicRoutes.map(({ route, priority, changeFrequency }) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
