import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { isUsernameValid } from "@/lib/username-utils";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Validate username request
const usernameSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9.]+$/),
});

export async function PUT(req: NextRequest) {
  try {
    // Get the current user from the session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate the request body
    const body = await req.json();
    const result = usernameSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid username format",
          details: result.error.format(),
        },
        { status: 400 }
      );
    }

    const { username } = result.data;

    // Check if the username is valid
    const validation = await isUsernameValid(username);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    // Update the user's username
    await prisma.user.update({
      where: { id: session.user.id },
      data: { username },
    });

    return NextResponse.json({
      success: true,
      message: "Username updated successfully",
      username,
    });
  } catch (error) {
    console.error("Error updating username:", error);
    return NextResponse.json(
      { error: "Failed to update username" },
      { status: 500 }
    );
  }
}
