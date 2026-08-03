import { NextRequest, NextResponse } from "next/server";
import { addEdit, communityMap, editBackend, listEdits } from "@/lib/edits";
import { getClaimableFields, getOfficialValue } from "@/lib/data";
import {
  APP_FEEDBACK_FIELD,
  APP_FEEDBACK_LABEL,
  APP_GRAIN,
  APP_SUBJECT_ID,
  GENERAL_FEEDBACK_FIELD,
  GENERAL_FEEDBACK_LABEL,
  GENERAL_FEEDBACK_MAX,
  GENERAL_FEEDBACK_MIN,
} from "@/lib/feedback";
import type { EditGrain } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const grain = req.nextUrl.searchParams.get("grain") ?? undefined;
    const subject_id = req.nextUrl.searchParams.get("subject_id") ?? undefined;
    const field = req.nextUrl.searchParams.get("field") ?? undefined;
    const statusParam = req.nextUrl.searchParams.get("status") ?? undefined;
    const status =
      statusParam === "pending" ||
      statusParam === "reviewed" ||
      statusParam === "rejected"
        ? statusParam
        : undefined;

    const edits = await listEdits({ grain, subject_id, field, status });
    const community =
      grain && subject_id && grain !== APP_GRAIN
        ? await communityMap(grain, subject_id)
        : {};
    return NextResponse.json({
      edits,
      community,
      edit_backend: editBackend(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const grain = body.grain as EditGrain;

    if (body.field === APP_FEEDBACK_FIELD || grain === APP_GRAIN) {
      if (grain !== APP_GRAIN) {
        return NextResponse.json(
          { error: "App feedback must use grain=app." },
          { status: 400 },
        );
      }
      if (body.field !== APP_FEEDBACK_FIELD) {
        return NextResponse.json(
          { error: "App feedback must use field=app_feedback." },
          { status: 400 },
        );
      }
      const text = String(body.text ?? body.rationale ?? "").trim();
      if (
        text.length < GENERAL_FEEDBACK_MIN ||
        text.length > GENERAL_FEEDBACK_MAX
      ) {
        return NextResponse.json(
          {
            error: `Feedback must be ${GENERAL_FEEDBACK_MIN}–${GENERAL_FEEDBACK_MAX} characters.`,
          },
          { status: 400 },
        );
      }
      if (!body.doctrine_ok) {
        return NextResponse.json(
          { error: "Doctrine check required." },
          { status: 400 },
        );
      }
      const edit = await addEdit({
        grain: APP_GRAIN,
        subject_id: APP_SUBJECT_ID,
        subject_label: String(body.subject_label || "The FF Collective"),
        field: APP_FEEDBACK_FIELD,
        field_label: APP_FEEDBACK_LABEL,
        official_value: null,
        value: null,
        confidence:
          body.confidence === "high" || body.confidence === "low"
            ? body.confidence
            : "med",
        rationale: text,
        doctrine_ok: true,
        author: String(body.author || "anonymous").slice(0, 64),
      });
      return NextResponse.json({ edit });
    }

    if (grain !== "team" && grain !== "player") {
      return NextResponse.json({ error: "Invalid grain." }, { status: 400 });
    }

    if (body.field === GENERAL_FEEDBACK_FIELD) {
      const text = String(body.text ?? body.rationale ?? "").trim();
      if (
        text.length < GENERAL_FEEDBACK_MIN ||
        text.length > GENERAL_FEEDBACK_MAX
      ) {
        return NextResponse.json(
          {
            error: `Feedback must be ${GENERAL_FEEDBACK_MIN}–${GENERAL_FEEDBACK_MAX} characters.`,
          },
          { status: 400 },
        );
      }
      if (!body.doctrine_ok) {
        return NextResponse.json(
          { error: "Doctrine check required." },
          { status: 400 },
        );
      }
      const edit = await addEdit({
        grain,
        subject_id: String(body.subject_id),
        subject_label: String(body.subject_label ?? body.subject_id),
        field: GENERAL_FEEDBACK_FIELD,
        field_label: GENERAL_FEEDBACK_LABEL,
        official_value: null,
        value: null,
        confidence:
          body.confidence === "high" || body.confidence === "low"
            ? body.confidence
            : "med",
        rationale: text,
        doctrine_ok: true,
        author: String(body.author || "anonymous").slice(0, 64),
      });
      return NextResponse.json({ edit });
    }

    const claimable = getClaimableFields();
    const fieldDef = claimable.find(
      (c) => c.field === body.field && c.grain === body.grain,
    );
    if (!fieldDef) {
      return NextResponse.json(
        { error: "Field is not claimable." },
        { status: 400 },
      );
    }
    if (fieldDef.unit === "text") {
      return NextResponse.json(
        { error: "Text fields are not editable." },
        { status: 400 },
      );
    }

    const value = Number(body.value);
    if (Number.isNaN(value) || value < fieldDef.min || value > fieldDef.max) {
      return NextResponse.json(
        {
          error: `Value must be between ${fieldDef.min} and ${fieldDef.max}.`,
        },
        { status: 400 },
      );
    }
    if (!body.rationale || String(body.rationale).trim().length < 8) {
      return NextResponse.json(
        { error: "Rationale required." },
        { status: 400 },
      );
    }
    if (!body.doctrine_ok) {
      return NextResponse.json(
        { error: "Doctrine check required." },
        { status: 400 },
      );
    }

    const official =
      body.official_value ??
      getOfficialValue(body.grain, body.subject_id, body.field);

    const edit = await addEdit({
      grain: body.grain,
      subject_id: String(body.subject_id),
      subject_label: String(body.subject_label ?? body.subject_id),
      field: fieldDef.field,
      field_label: fieldDef.label,
      official_value: official,
      value,
      confidence:
        body.confidence === "high" || body.confidence === "low"
          ? body.confidence
          : "med",
      rationale: String(body.rationale).trim(),
      doctrine_ok: true,
      author: String(body.author || "anonymous").slice(0, 64),
    });

    return NextResponse.json({ edit });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
