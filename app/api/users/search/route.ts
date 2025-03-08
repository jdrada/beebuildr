import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  try {
    // Get the current user from the session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    // Ensure query is at least 2 characters long
    if (query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Search for users by username or email (except the current user)
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              {
                username: {
                  contains: query.toLowerCase(),
                  mode: "insensitive",
                },
              },
              { email: { contains: query.toLowerCase(), mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          },
          {
            NOT: { id: session.user.id }, // Exclude the current user
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
      },
      take: limit,
    });

    // Return the results
    return NextResponse.json({
      users: users.map((user) => ({
        ...user,
        // Format display name based on available data
        displayName:
          user.name ||
          user.email?.split("@")[0] ||
          user.username ||
          "Unknown User",
      })),
    });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
