import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  removeLeetCodeConnectionForUser,
  updateLeetCodeConnectionForUser,
} from "@/lib/users";
import {
  deleteLeetCodeStatsForUser,
  getLeetCodeStatsForUser,
} from "@/lib/leetcode/cache";

const USERNAME_PATTERN = /^[a-z0-9_-]{3,20}$/i;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const username = typeof body?.username === "string" ? body.username.trim() : "";

    if (!USERNAME_PATTERN.test(username)) {
      return NextResponse.json(
        {
          error: "Enter a valid LeetCode username (letters, numbers, underscores, dashes).",
        },
        { status: 400 }
      );
    }

    await updateLeetCodeConnectionForUser(session.user.id, {
      username,
    });

    const stats = await getLeetCodeStatsForUser(session.user.id, username);

    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    console.error("[api] Failed to connect LeetCode", error);
    return NextResponse.json({ error: "Failed to connect LeetCode" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await Promise.all([
      removeLeetCodeConnectionForUser(session.user.id),
      deleteLeetCodeStatsForUser(session.user.id),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api] Failed to disconnect LeetCode", error);
    return NextResponse.json({ error: "Failed to disconnect LeetCode" }, { status: 500 });
  }
}
