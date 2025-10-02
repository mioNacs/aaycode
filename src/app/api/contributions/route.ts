import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getContributionSeriesForUser } from "@/lib/contribution-aggregator";
import { findUserById } from "@/lib/users";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await findUserById(session.user.id);

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start") ?? undefined;
    const end = searchParams.get("end") ?? undefined;

    const isIsoDate = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value);

    if ((start && !isIsoDate(start)) || (end && !isIsoDate(end))) {
      return NextResponse.json({ success: false, error: "Invalid date format" }, { status: 400 });
    }

    const { series, warnings } = await getContributionSeriesForUser(user, {
      start,
      end,
    });

    return NextResponse.json(
      {
        success: true,
        series,
        warnings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[api] Failed to load contributions", error);
    return NextResponse.json({ success: false, error: "Failed to load contributions" }, { status: 500 });
  }
}
