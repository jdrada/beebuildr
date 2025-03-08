import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ensureAllUsersHaveUsernames } from "@/lib/username-utils";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest) {
  try {
    // Require authentication and admin access
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only the first user (admin) can access this endpoint
    // In a real app, you'd want more robust admin checks
    const firstUser = await prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (firstUser?.id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Run the function to ensure all users have usernames
    await ensureAllUsersHaveUsernames();

    // Return success
    return NextResponse.json({
      success: true,
      message: "Usernames generated for all users",
    });
  } catch (error) {
    console.error("Error generating usernames:", error);
    return NextResponse.json(
      { error: "Failed to generate usernames" },
      { status: 500 }
    );
  }
}
