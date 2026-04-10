import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import type { NewsletterSubscriber } from "@/backend/newsletter/types";

const FILE = path.join(process.cwd(), "backend", "data", "newsletter-subscribers.json");

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function readNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (x): x is NewsletterSubscriber =>
        !!x &&
        typeof x === "object" &&
        typeof (x as NewsletterSubscriber).email === "string" &&
        typeof (x as NewsletterSubscriber).subscribedAt === "string"
    );
  } catch {
    return [];
  }
}

export async function appendNewsletterSubscriber(
  email: string,
  source = "footer"
): Promise<{ created: boolean }> {
  const normalized = normalizeEmail(email);
  if (!normalized) return { created: false };

  const list = await readNewsletterSubscribers();
  if (list.some((s) => s.email === normalized)) {
    return { created: false };
  }

  list.push({
    email: normalized,
    subscribedAt: new Date().toISOString(),
    source,
  });

  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(list, null, 2) + "\n", "utf8");
  return { created: true };
}
