import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  removeCodeforcesConnectionForUser,
  updateCodeforcesConnectionForUser,
} from "@/lib/users";
import {
  deleteCodeforcesStatsForUser,
  getCodeforcesStatsForUser,
} from "@/lib/codeforces/cache";

const HANDLE_PATTERN = /^[a-zA-Z0-9_.-]{3,24}$/;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const handle = typeof body?.handle === "string" ? body.handle.trim() : "";

    if (!HANDLE_PATTERN.test(handle)) {
      return NextResponse.json(
        {
          error: "Enter a valid Codeforces handle (letters, numbers, underscores, dashes, dots).",
        },
        { status: 400 }
      );
    }

    await updateCodeforcesConnectionForUser(session.user.id, {
      handle,
    });

    const stats = await getCodeforcesStatsForUser(session.user.id, handle);

    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    console.error("[api] Failed to connect Codeforces", error);
    return NextResponse.json({ error: "Failed to connect Codeforces" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await Promise.all([
      removeCodeforcesConnectionForUser(session.user.id),
      deleteCodeforcesStatsForUser(session.user.id),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api] Failed to disconnect Codeforces", error);
    return NextResponse.json({ error: "Failed to disconnect Codeforces" }, { status: 500 });
  }
}
