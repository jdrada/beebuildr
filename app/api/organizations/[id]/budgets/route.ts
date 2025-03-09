import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user from the session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = params.id;

    // Check if the user is a member of this organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this organization" },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const isTemplate = searchParams.get("isTemplate");

    // Build the where clause
    const where: any = { organizationId };

    // Filter by template status if specified
    if (isTemplate === "true") {
      where.isTemplate = true;
    } else if (isTemplate === "false") {
      where.isTemplate = false;
    }

    // Get all budgets for this organization
    const budgets = await prisma.budget.findMany({
      where,
      include: {
        budgetItems: {
          include: {
            item: true,
          },
        },
        budgetProjects: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({ budgets });
  } catch (error) {
    console.error("Error fetching organization budgets:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization budgets" },
      { status: 500 }
    );
  }
}
