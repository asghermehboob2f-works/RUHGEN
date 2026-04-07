import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { saveAdminMediaUpload } from "@/backend/media/upload";

export async function POST(req: Request) {
  try {
    const result = await saveAdminMediaUpload(req);
    revalidatePath("/");
    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: msg === "Unauthorized." ? 401 : 400 });
  }
}
