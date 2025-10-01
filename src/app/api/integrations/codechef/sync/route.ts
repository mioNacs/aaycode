import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { refreshCodechefStatsForUser } from "@/lib/codechef/cache";
import { findUserById } from "@/lib/users";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await findUserById(session.user.id);

    if (!user?.connections?.codechef?.username) {
      return NextResponse.json({ error: "CodeChef is not connected." }, { status: 400 });
    }

    const username = user.connections.codechef.username;
    const fresh = await refreshCodechefStatsForUser(session.user.id, username);

    if (!fresh) {
      return NextResponse.json(
        { error: "Could not refresh CodeChef stats. Please verify the username." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, fetchedAt: fresh.fetchedAt.toISOString() });
  } catch (error) {
    console.error("[api] Failed to sync CodeChef", error);
    return NextResponse.json({ error: "Failed to sync CodeChef" }, { status: 500 });
  }
}
