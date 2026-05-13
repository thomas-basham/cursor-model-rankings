import { NextResponse } from "next/server";
import { requireAdminKey } from "@/lib/adminAuth";
import { publishDraftRanking } from "@/lib/modelsRepository";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const auth = requireAdminKey(request);
  if (!auth.ok) return auth.response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const batchId = body?.batchId;
  if (typeof batchId !== "string" || !batchId.trim()) {
    return NextResponse.json(
      { ok: false, error: "batchId is required" },
      { status: 400 },
    );
  }

  try {
    const result = await publishDraftRanking(batchId.trim());
    return NextResponse.json({
      ok: true,
      batchId: result.batchId,
      publishedAt: result.publishedAt,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Publish failed";
    const status =
      message.includes("No ranking") ||
      message.includes("not a draft") ||
      message.includes("exactly 10")
        ? 400
        : 500;
    console.error(e);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
