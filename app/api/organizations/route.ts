import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { MemberRole, OrganizationType } from "@/lib/auth-utils";
import {
  hasReachedOrganizationLimit,
  getRemainingOrganizationCount,
} from "@/lib/limits";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Validate organization request
const organizationSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum([OrganizationType.CONTRACTOR, OrganizationType.STORE]),
});

// GET /api/organizations - List organizations the user is a member of
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    console.log("Fetching organizations for user:", userId);

    // Get organizations the user is a member of
    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: true,
      },
    });

    const organizations = memberships.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      type: membership.organization.type,
      role: membership.role,
      createdAt: membership.organization.createdAt,
    }));

    // Get remaining organization count
    const remainingCount = await getRemainingOrganizationCount(userId);
    console.log("User has", remainingCount, "organizations remaining");

    return NextResponse.json({
      organizations,
      limits: {
        remaining: remainingCount,
      },
    });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}

// POST /api/organizations - Create a new organization
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Better error handling for missing session or user
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure we have a user ID
    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 400 }
      );
    }

    console.log("Creating organization for user:", userId);

    // Parse and validate the request body
    const body = await req.json();
    const result = organizationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.format() },
        { status: 400 }
      );
    }

    const { name, type } = result.data;

    // Get current organization count
    const remaining = await getRemainingOrganizationCount(userId);
    console.log("User has", remaining, "organizations remaining");

    // Check if the user has reached their organization limit
    const hasReachedLimit = await hasReachedOrganizationLimit(userId);
    console.log("Has reached limit:", hasReachedLimit);

    if (hasReachedLimit) {
      return NextResponse.json(
        {
          error: "Organization limit reached",
          message:
            "You have reached the limit of free organizations. Please upgrade to create more.",
        },
        { status: 403 }
      );
    }

    // Create the organization and add the user as an admin
    const organization = await prisma.$transaction(async (tx) => {
      // Create the organization
      const newOrg = await tx.organization.create({
        data: {
          name,
          type,
        },
      });

      console.log("Created organization:", newOrg.id);

      // Add the user as an admin - with explicit userId
      await tx.organizationMember.create({
        data: {
          organizationId: newOrg.id,
          userId,
          role: MemberRole.ADMIN,
        },
      });

      console.log("Added user as admin");
      return newOrg;
    });

    // Set this organization as the active one
    session.activeOrganizationId = organization.id;

    return NextResponse.json(
      {
        organization: {
          id: organization.id,
          name: organization.name,
          type: organization.type,
          role: MemberRole.ADMIN,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}
