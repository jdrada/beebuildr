import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkProjectViewPermission } from "@/lib/project-utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user from the session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.id;

    // Check if the user has permission to view this project
    const permission = await checkProjectViewPermission(
      session.user.id,
      projectId
    );
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    // Get all budgets associated with this project
    const budgetProjects = await prisma.budgetProject.findMany({
      where: {
        projectId,
      },
      include: {
        budget: {
          include: {
            budgetItems: {
              include: {
                item: true,
              },
            },
          },
        },
      },
    });

    // Extract the budgets from the budgetProjects
    const budgets = budgetProjects.map((bp) => bp.budget);

    return NextResponse.json({ budgets });
  } catch (error) {
    console.error("Error fetching project budgets:", error);
    return NextResponse.json(
      { error: "Failed to fetch project budgets" },
      { status: 500 }
    );
  }
}
