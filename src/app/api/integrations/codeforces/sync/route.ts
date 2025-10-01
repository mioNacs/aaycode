import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { refreshCodeforcesStatsForUser } from "@/lib/codeforces/cache";
import { findUserById } from "@/lib/users";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await findUserById(session.user.id);

    if (!user?.connections?.codeforces?.handle) {
      return NextResponse.json({ error: "Codeforces is not connected." }, { status: 400 });
    }

    const handle = user.connections.codeforces.handle;
    const fresh = await refreshCodeforcesStatsForUser(session.user.id, handle);

    if (!fresh) {
      return NextResponse.json(
        { error: "Could not refresh Codeforces stats. Please verify the handle." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, fetchedAt: fresh.fetchedAt.toISOString() });
  } catch (error) {
    console.error("[api] Failed to sync Codeforces", error);
    return NextResponse.json({ error: "Failed to sync Codeforces" }, { status: 500 });
  }
}
