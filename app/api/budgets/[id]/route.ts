import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Enum imports would normally come from Prisma client
// But since we're getting type errors, we'll define them here
enum MemberRole {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
  VIEWER = "VIEWER",
}

enum OrganizationType {
  CONTRACTOR = "CONTRACTOR",
  STORE = "STORE",
}

// Validate the budget update request body
const updateBudgetSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
});

// Check if the user has permission to perform budget actions
async function checkBudgetPermission(
  userId: string,
  budgetId: string,
  requiredRoles: MemberRole[] = [MemberRole.ADMIN, MemberRole.MEMBER]
) {
  // Get the budget with its organization
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: { organization: true },
  });

  if (!budget) {
    return {
      allowed: false,
      error: "Budget not found",
      status: 404,
    };
  }

  // Check organization type
  if (budget.organization.type !== OrganizationType.CONTRACTOR) {
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
      organizationId: budget.organizationId,
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
    budget,
    membership,
  };
}

// GET /api/budgets/[id] - Get a single budget
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Check permission - viewers can see budgets
    const permissionCheck = await checkBudgetPermission(session.user.id, id, [
      MemberRole.ADMIN,
      MemberRole.MEMBER,
      MemberRole.VIEWER,
    ]);

    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    // Get the budget with budget items
    const budget = await prisma.budget.findUnique({
      where: { id },
      include: {
        budgetItems: {
          include: {
            item: true,
          },
        },
      },
    });

    return NextResponse.json({ budget });
  } catch (error) {
    console.error("Error fetching budget:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget" },
      { status: 500 }
    );
  }
}

// PATCH /api/budgets/[id] - Update a budget
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Parse and validate the request body
    const body = await req.json();
    const result = updateBudgetSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.format() },
        { status: 400 }
      );
    }

    // Check permission - only ADMIN and MEMBER can update budgets
    const permissionCheck = await checkBudgetPermission(session.user.id, id, [
      MemberRole.ADMIN,
      MemberRole.MEMBER,
    ]);

    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    // Update the budget
    const updatedBudget = await prisma.budget.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json({ budget: updatedBudget });
  } catch (error) {
    console.error("Error updating budget:", error);
    return NextResponse.json(
      { error: "Failed to update budget" },
      { status: 500 }
    );
  }
}

// DELETE /api/budgets/[id] - Delete a budget
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Check permission - only ADMIN can delete budgets
    const permissionCheck = await checkBudgetPermission(session.user.id, id, [
      MemberRole.ADMIN,
    ]);

    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    // Delete the budget and related items
    await prisma.budget.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting budget:", error);
    return NextResponse.json(
      { error: "Failed to delete budget" },
      { status: 500 }
    );
  }
}
