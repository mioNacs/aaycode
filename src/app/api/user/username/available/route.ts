import { NextResponse } from "next/server";

import {
  findUserByUsername,
  isUsernameValid,
  normalizeUsername,
} from "@/lib/users";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const usernameParam = searchParams.get("username");

  if (!usernameParam) {
    return NextResponse.json(
      {
        available: false,
        reason: "Username query parameter is required.",
      },
      { status: 400 }
    );
  }

  const normalizedUsername = normalizeUsername(usernameParam);

  if (!isUsernameValid(normalizedUsername)) {
    return NextResponse.json(
      {
        available: false,
        reason: "Usernames must be 3-20 characters using letters, numbers, or underscores.",
      },
      { status: 200 }
    );
  }

  const existingUser = await findUserByUsername(normalizedUsername);

  return NextResponse.json({ available: !existingUser });
}
