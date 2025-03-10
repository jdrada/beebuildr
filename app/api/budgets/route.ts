import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";
import { MemberRole } from "@prisma/client";

// Enum definitions to avoid importing from Prisma client
enum OrganizationType {
  CONTRACTOR = "CONTRACTOR",
  STORE = "STORE",
}

// Validate the budget request body
const budgetSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  organizationId: z.string(),
});

// Validate budget creation request
const createBudgetSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional().nullable(),
  isTemplate: z.boolean().default(false),
  organizationId: z.string().min(1, "Organization ID is required"),
  projectId: z.string().optional(),
});

// Check if the user has permission to perform budget actions
async function checkPermission(
  userId: string,
  organizationId: string,
  requiredRoles: MemberRole[] = [MemberRole.ADMIN, MemberRole.MEMBER]
) {
  // Get the organization
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!organization) {
    return {
      allowed: false,
      error: "Organization not found",
      status: 404,
    };
  }

  // Check organization type
  if (organization.type !== OrganizationType.CONTRACTOR) {
    return {
      allowed: false,
      error: "Only contractor organizations can manage budgets",
      status: 403,
    };
  }

  // Find the user's membership in the organization
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId,
    },
  });

  if (!membership) {
    return {
      allowed: false,
      error: "You are not a member of this organization",
      status: 403,
    };
  }

  // Check if the user has the required role
  if (!requiredRoles.includes(membership.role as MemberRole)) {
    return {
      allowed: false,
      error: "You don't have permission to perform this action",
      status: 403,
    };
  }

  return {
    allowed: true,
    organization,
    membership,
  };
}

// GET /api/budgets - List budgets for the active organization
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || !session?.activeOrganizationId) {
      return NextResponse.json(
        {
          error: session?.user
            ? "No active organization selected"
            : "Unauthorized",
        },
        { status: session?.user ? 400 : 401 }
      );
    }

    const { activeOrganizationId } = session;
    const { searchParams } = new URL(req.url);

    // Use the query parameter if provided, otherwise use the active organization
    const organizationId =
      searchParams.get("organizationId") || activeOrganizationId;

    // Check permission - for viewing budgets, VIEWER role is sufficient
    const permissionCheck = await checkPermission(
      session.user.id,
      organizationId,
      [MemberRole.ADMIN, MemberRole.MEMBER, MemberRole.VIEWER]
    );

    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    // Get budgets for the organization
    const budgets = await prisma.budget.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({ budgets });
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json(
      { error: "Failed to fetch budgets" },
      { status: 500 }
    );
  }
}

// POST /api/budgets - Create a new budget
export async function POST(req: NextRequest) {
  try {
    // Get the current user from the session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate the request body
    const body = await req.json();
    const result = createBudgetSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.format() },
        { status: 400 }
      );
    }

    const { title, description, isTemplate, organizationId, projectId } =
      result.data;

    // Check if the user is a member of this organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
        role: {
          in: [MemberRole.ADMIN, MemberRole.MEMBER],
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        {
          error:
            "You don't have permission to create budgets in this organization",
        },
        { status: 403 }
      );
    }

    // If projectId is provided, check if the project exists and belongs to the organization
    // Also check if the project already has a budget
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          organizationId,
        },
        include: {
          budgetProjects: true,
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: "Project not found or doesn't belong to this organization" },
          { status: 404 }
        );
      }

      // Check if the project already has a budget
      if (project.budgetProjects.length > 0) {
        return NextResponse.json(
          {
            error:
              "This project already has a budget. Currently, only one budget per project is supported.",
          },
          { status: 400 }
        );
      }
    }

    // Create the budget
    const budget = await prisma.budget.create({
      data: {
        title,
        description,
        organizationId,
        ...(projectId && {
          budgetProjects: {
            create: {
              projectId,
            },
          },
        }),
      },
      include: {
        budgetItems: true,
      },
    });

    // Update the isTemplate field separately since it's not in the schema yet
    const updatedBudget = await prisma.budget.update({
      where: { id: budget.id },
      data: { isTemplate },
      include: {
        budgetItems: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Budget created successfully",
      budget: updatedBudget,
    });
  } catch (error) {
    console.error("Error creating budget:", error);
    return NextResponse.json(
      { error: "Failed to create budget" },
      { status: 500 }
    );
  }
}
