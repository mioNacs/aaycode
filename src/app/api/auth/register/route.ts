import { NextResponse } from "next/server";
import { hash } from "bcryptjs";

import {
  findUserByUsername,
  getUsersCollection,
  isUsernameValid,
  normalizeUsername,
} from "@/lib/users";

const PASSWORD_MIN_LENGTH = 8;

export async function POST(request: Request) {
  try {
    const { email, password, name, username } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/u)) {
      return NextResponse.json(
        { success: false, error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Password is required." },
        { status: 400 }
      );
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`,
        },
        { status: 400 }
      );
    }

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

    const users = await getUsersCollection();

    const [existingUser, usernameOwner] = await Promise.all([
      users.findOne({ email: normalizedEmail }),
      findUserByUsername(normalizedUsername),
    ]);

    if (
      usernameOwner &&
      (!existingUser || usernameOwner._id.toString() !== existingUser._id.toString())
    ) {
      return NextResponse.json(
        { success: false, error: "That username is already taken." },
        { status: 409 }
      );
    }

    if (existingUser?.hashedPassword) {
      return NextResponse.json(
        { success: false, error: "An account with that email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);
    const now = new Date();
    const trimmedName =
      typeof name === "string" && name.trim().length > 0
        ? name.trim()
        : existingUser?.name ?? null;

    if (existingUser) {
      await users.updateOne(
        { _id: existingUser._id },
        {
          $set: {
            email: normalizedEmail,
            hashedPassword,
            name: trimmedName,
            username: normalizedUsername,
            updatedAt: now,
          },
        }
      );
    } else {
      await users.insertOne({
        email: normalizedEmail,
        name: trimmedName,
        hashedPassword,
        username: normalizedUsername,
        emailVerified: null,
        image: null,
        createdAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[register] error", error);
    return NextResponse.json(
      { success: false, error: "Unable to create account." },
      { status: 500 }
    );
  }
}
