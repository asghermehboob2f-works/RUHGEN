import type { SiteContent } from "@/backend/site-content/types";
import siteContentSeed from "../../../backend/data/site-content.json";

/** Used as source of truth and fallback defaults for public website rendering. */
export const PUBLIC_DEFAULT_SITE_CONTENT: SiteContent = siteContentSeed as unknown as SiteContent;
