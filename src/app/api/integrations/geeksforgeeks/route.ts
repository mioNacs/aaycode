import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  removeGeeksforgeeksConnectionForUser,
  updateGeeksforgeeksConnectionForUser,
} from "@/lib/users";
import {
  deleteGeeksforgeeksStatsForUser,
  getGeeksforgeeksStatsForUser,
} from "@/lib/geeksforgeeks/cache";

const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,30}$/;

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
          error: "Enter a valid GeeksforGeeks username (letters, numbers, underscores, dots, dashes).",
        },
        { status: 400 }
      );
    }

    await updateGeeksforgeeksConnectionForUser(session.user.id, {
      username,
    });

    const stats = await getGeeksforgeeksStatsForUser(session.user.id, username);

    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    console.error("[api] Failed to connect GeeksforGeeks", error);
    return NextResponse.json({ error: "Failed to connect GeeksforGeeks" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await Promise.all([
      removeGeeksforgeeksConnectionForUser(session.user.id),
      deleteGeeksforgeeksStatsForUser(session.user.id),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api] Failed to disconnect GeeksforGeeks", error);
    return NextResponse.json({ error: "Failed to disconnect GeeksforGeeks" }, { status: 500 });
  }
}
