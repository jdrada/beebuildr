import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";

// Validate request body
const applyBudgetSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  createCopy: z.boolean().optional().default(false), // Whether to create a copy of template budget
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user from the session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const budgetId = params.id;

    // Parse and validate request body
    const body = await req.json();
    const result = applyBudgetSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.format() },
        { status: 400 }
      );
    }

    const { projectId, createCopy } = result.data;

    // Get the budget and check if it exists
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
      include: {
        budgetItems: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    // Check if user has permission to access both the budget and project
    const [budgetOrg, projectOrg] = await Promise.all([
      prisma.organization.findFirst({
        where: {
          id: budget.organizationId,
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      }),
      prisma.project.findFirst({
        where: {
          id: projectId,
          organization: {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        },
      }),
    ]);

    if (!budgetOrg || !projectOrg) {
      return NextResponse.json(
        { error: "You don't have permission to perform this action" },
        { status: 403 }
      );
    }

    // Check if the budget is already associated with this project
    const existingAssociation = await prisma.budgetProject.findFirst({
      where: {
        budgetId,
        projectId,
      },
    });

    if (existingAssociation) {
      return NextResponse.json({
        success: true,
        message: "Budget is already applied to this project",
        budgetProject: existingAssociation,
      });
    }

    // If createCopy is true, create a new budget
    if (createCopy) {
      // Create a new budget as a copy
      const newBudget = await prisma.budget.create({
        data: {
          title: `${budget.title} - Copy for ${projectOrg.name}`,
          description: budget.description,
          isTemplate: false,
          organizationId: budget.organizationId,
          budgetProjects: {
            create: {
              projectId,
            },
          },
        },
      });

      // Copy all budget items
      if (budget.budgetItems.length > 0) {
        await prisma.budgetItem.createMany({
          data: budget.budgetItems.map((item) => ({
            budgetId: newBudget.id,
            itemId: item.itemId,
            quantity: item.quantity,
            priceAtTime: item.priceAtTime,
          })),
        });
      }

      return NextResponse.json({
        success: true,
        message: "Budget copied and applied to project",
        budget: newBudget,
      });
    }

    // Otherwise, just create the association
    const budgetProject = await prisma.budgetProject.create({
      data: {
        budgetId,
        projectId,
      },
      include: {
        budget: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Budget applied to project",
      budgetProject,
    });
  } catch (error) {
    console.error("Error applying budget to project:", error);
    return NextResponse.json(
      { error: "Failed to apply budget to project" },
      { status: 500 }
    );
  }
}
