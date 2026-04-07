import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { ContactMessage } from "@/backend/contact/types";

const FILE = path.join(process.cwd(), "data", "contact-messages.json");

const MAX_MESSAGE_LEN = 8000;
const MAX_NAME_LEN = 200;

export async function readContactMessages(): Promise<ContactMessage[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (x): x is ContactMessage =>
        !!x &&
        typeof x === "object" &&
        typeof (x as ContactMessage).id === "string" &&
        typeof (x as ContactMessage).name === "string" &&
        typeof (x as ContactMessage).email === "string" &&
        typeof (x as ContactMessage).message === "string" &&
        typeof (x as ContactMessage).submittedAt === "string"
    );
  } catch {
    return [];
  }
}

export async function appendContactMessage(input: {
  name: string;
  email: string;
  message: string;
}): Promise<ContactMessage> {
  const name = input.name.trim().slice(0, MAX_NAME_LEN);
  const email = input.email.trim().toLowerCase();
  const message = input.message.trim().slice(0, MAX_MESSAGE_LEN);

  const row: ContactMessage = {
    id: randomUUID(),
    name,
    email,
    message,
    submittedAt: new Date().toISOString(),
  };

  const list = await readContactMessages();
  list.push(row);

  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(list, null, 2) + "\n", "utf8");
  return row;
}
