import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Enum definitions to avoid importing from Prisma client
enum MemberRole {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
  VIEWER = "VIEWER",
}

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
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate the request body
    const body = await req.json();
    const result = budgetSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.format() },
        { status: 400 }
      );
    }

    const { title, description, organizationId } = result.data;

    // Check permission - only ADMIN and MEMBER can create budgets
    const permissionCheck = await checkPermission(
      session.user.id,
      organizationId,
      [MemberRole.ADMIN, MemberRole.MEMBER]
    );

    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    // Create the budget
    const budget = await prisma.budget.create({
      data: {
        title,
        description,
        organizationId,
      },
    });

    return NextResponse.json({ budget }, { status: 201 });
  } catch (error) {
    console.error("Error creating budget:", error);
    return NextResponse.json(
      { error: "Failed to create budget" },
      { status: 500 }
    );
  }
}
