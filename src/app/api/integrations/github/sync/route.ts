import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { refreshGitHubStatsForUser } from "@/lib/github/cache";
import { findUserById } from "@/lib/users";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await findUserById(session.user.id);

    if (!user?.connections?.github?.username) {
      return NextResponse.json({ error: "GitHub is not connected." }, { status: 400 });
    }

    const username = user.connections.github.username;
    const fresh = await refreshGitHubStatsForUser(session.user.id, username);

    if (!fresh) {
      return NextResponse.json(
        { error: "Could not refresh GitHub stats. Please verify the username." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, fetchedAt: fresh.fetchedAt.toISOString() });
  } catch (error) {
    console.error("[api] Failed to sync GitHub", error);
    return NextResponse.json({ error: "Failed to sync GitHub" }, { status: 500 });
  }
}
