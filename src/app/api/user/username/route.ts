import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  findUserByUsername,
  isUsernameValid,
  normalizeUsername,
  updateUsernameForUser,
} from "@/lib/users";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "You must be signed in to update your username." },
      { status: 401 }
    );
  }

  try {
    const { username } = await request.json();

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { success: false, error: "Username is required." },
        { status: 400 }
      );
    }

    const normalizedUsername = normalizeUsername(username);

    if (!isUsernameValid(normalizedUsername)) {
      return NextResponse.json(
        {
          success: false,
          error: "Usernames must be 3-20 characters using letters, numbers, or underscores.",
        },
        { status: 400 }
      );
    }

    const existingUser = await findUserByUsername(normalizedUsername);

    if (existingUser && existingUser._id.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "That username is already taken." },
        { status: 409 }
      );
    }

    await updateUsernameForUser(session.user.id, normalizedUsername);

    return NextResponse.json(
      { success: true, username: normalizedUsername },
      { status: 200 }
    );
  } catch (error) {
    console.error("[username.update] error", error);
    return NextResponse.json(
      { success: false, error: "Unable to update username." },
      { status: 500 }
    );
  }
}
