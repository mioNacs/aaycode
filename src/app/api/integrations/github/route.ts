import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { removeGitHubConnectionForUser } from "@/lib/users";
import { deleteGitHubStatsForUser } from "@/lib/github/cache";

export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await Promise.all([
      removeGitHubConnectionForUser(session.user.id),
      deleteGitHubStatsForUser(session.user.id),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api] Failed to disconnect GitHub", error);
    return NextResponse.json({ error: "Failed to disconnect GitHub" }, { status: 500 });
  }
}
