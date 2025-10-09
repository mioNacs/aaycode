import { NextRequest, NextResponse } from "next/server";
import { findUserByUsername } from "@/lib/users";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const user = await findUserByUsername(username);

  if (!user) {
    return NextResponse.json(
      { success: false, error: "User not found." },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        name: user.name,
        image: user.image,
        joinedAt: user.createdAt,
      },
    },
    { status: 200 }
  );
}