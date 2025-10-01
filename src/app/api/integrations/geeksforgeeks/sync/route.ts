import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { refreshGeeksforgeeksStatsForUser } from "@/lib/geeksforgeeks/cache";
import { findUserById } from "@/lib/users";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await findUserById(session.user.id);

    if (!user?.connections?.geeksforgeeks?.username) {
      return NextResponse.json({ error: "GeeksforGeeks is not connected." }, { status: 400 });
    }

    const username = user.connections.geeksforgeeks.username;
    const fresh = await refreshGeeksforgeeksStatsForUser(session.user.id, username);

    if (!fresh) {
      return NextResponse.json(
        { error: "Could not refresh GeeksforGeeks stats. Please verify the username." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, fetchedAt: fresh.fetchedAt.toISOString() });
  } catch (error) {
    console.error("[api] Failed to sync GeeksforGeeks", error);
    return NextResponse.json({ error: "Failed to sync GeeksforGeeks" }, { status: 500 });
  }
}
