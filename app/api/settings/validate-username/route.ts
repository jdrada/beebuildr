import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Validate username request
const usernameSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9.]+$/),
});

export async function POST(req: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await req.json();
    const result = usernameSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          valid: false,
          message:
            "Username must be 3-20 characters and can only contain lowercase letters, numbers, and dots.",
        },
        { status: 400 }
      );
    }

    const { username } = result.data;

    // Check if username is already taken
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { valid: false, message: "This username is already taken." },
        { status: 200 }
      );
    }

    // Username is valid and available
    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Error validating username:", error);
    return NextResponse.json(
      { valid: false, message: "Failed to validate username" },
      { status: 500 }
    );
  }
}
