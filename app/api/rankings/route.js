import { NextResponse } from "next/server";
import { getLatestPublishedRanking } from "@/lib/modelsRepository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ranking = await getLatestPublishedRanking();
    if (!ranking) {
      return NextResponse.json({
        ok: true,
        ranking: null,
        message: "No published ranking yet",
      });
    }
    return NextResponse.json({
      ok: true,
      ranking: {
        batchId: ranking.batchId,
        updatedAt: ranking.updatedAt,
        models: ranking.models,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Failed to load rankings",
      },
      { status: 500 },
    );
  }
}
