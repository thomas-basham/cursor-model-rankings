import { NextResponse } from "next/server";
import { requireAdminKey } from "@/lib/adminAuth";
import { getLatestDraftRanking, saveDraftRanking } from "@/lib/modelsRepository";
import {
  normalizeModels,
  parseDraftBody,
} from "@/lib/rankingValidation";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const auth = requireAdminKey(request);
  if (!auth.ok) return auth.response;

  try {
    const draft = await getLatestDraftRanking();
    if (!draft) {
      return NextResponse.json({
        ok: true,
        draft: null,
        message: "No draft ranking found",
      });
    }
    return NextResponse.json({
      ok: true,
      draft: {
        batchId: draft.batchId,
        updatedAt: draft.updatedAt,
        models: draft.models,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Failed to load draft",
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const auth = requireAdminKey(request);
  if (!auth.ok) return auth.response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseDraftBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  try {
    const models = normalizeModels(parsed.models);
    const { batchId } = await saveDraftRanking(models);
    return NextResponse.json({ ok: true, batchId }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Failed to save draft",
      },
      { status: 500 },
    );
  }
}
