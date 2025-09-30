import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  removeCodechefConnectionForUser,
  updateCodechefConnectionForUser,
} from "@/lib/users";
import {
  deleteCodechefStatsForUser,
  getCodechefStatsForUser,
} from "@/lib/codechef/cache";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{2,30}$/;

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
          error: "Enter a valid CodeChef username (letters, numbers, underscores).",
        },
        { status: 400 }
      );
    }

    await updateCodechefConnectionForUser(session.user.id, {
      username,
    });

    const stats = await getCodechefStatsForUser(session.user.id, username);

    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    console.error("[api] Failed to connect CodeChef", error);
    return NextResponse.json({ error: "Failed to connect CodeChef" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await Promise.all([
      removeCodechefConnectionForUser(session.user.id),
      deleteCodechefStatsForUser(session.user.id),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api] Failed to disconnect CodeChef", error);
    return NextResponse.json({ error: "Failed to disconnect CodeChef" }, { status: 500 });
  }
}
