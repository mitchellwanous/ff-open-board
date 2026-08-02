import { NextRequest, NextResponse } from "next/server";
import { markEdits } from "@/lib/edits";

export const runtime = "nodejs";

/**
 * Mark open-source edits reviewed/rejected (daily operator loop).
 * Protected by REVIEW_API_SECRET when set (required in production).
 */
export async function POST(req: NextRequest) {
  try {
    const secret = process.env.REVIEW_API_SECRET;
    if (secret) {
      const hdr = req.headers.get("x-review-secret");
      if (hdr !== secret) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }
    }

    const body = await req.json();
    const ids: string[] = Array.isArray(body.ids)
      ? body.ids.map(String)
      : [];
    const status = body.status;
    if (status !== "reviewed" && status !== "rejected") {
      return NextResponse.json(
        { error: "status must be reviewed or rejected." },
        { status: 400 },
      );
    }
    if (!ids.length) {
      return NextResponse.json({ error: "ids required." }, { status: 400 });
    }
    const n = await markEdits(ids, status, body.decision_note);
    return NextResponse.json({ updated: n });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
