import { NextResponse } from "next/server";

import { findUserByUsername } from "@/lib/users";

type RouteParams = {
  params: {
    username: string;
  };
};

export async function GET(_request: Request, { params }: RouteParams) {
  const user = await findUserByUsername(params.username);

  if (!user) {
    return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
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
