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

    // Get the organization ID from the URL params
    const { id: organizationId } = params;

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
    const isPublic = searchParams.get("isPublic") === "true";

    // Build the where clause
    const where: Record<string, any> = { organizationId };

    // If isPublic is specified, filter by it
    if (searchParams.has("isPublic")) {
      where.isPublic = isPublic;
    }

    // Get all UPAs for this organization
    const unitPriceAnalyses = await prisma.unitPriceAnalysis.findMany({
      where,
      include: {
        materials: true,
        labor: true,
        equipment: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({ unitPriceAnalyses });
  } catch (error) {
    console.error("Error fetching organization unit price analyses:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization unit price analyses" },
      { status: 500 }
    );
  }
}
