import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { MemberRole, OrganizationType } from "@prisma/client";

// Validate organization update request
const updateOrgSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  type: z.enum([OrganizationType.CONTRACTOR, OrganizationType.STORE]),
});

// GET /api/organizations/[id] - Get organization details
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

    // Ensure params.id is available
    const organizationId = params.id;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

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

    // Get the organization details
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: {
            members: true,
            projects: true,
            budgets: true,
            items: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ organization });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization" },
      { status: 500 }
    );
  }
}

// PATCH /api/organizations/[id] - Update organization details
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user from the session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure params.id is available
    const organizationId = params.id;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Check if the user is an admin of this organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
        role: MemberRole.ADMIN,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Only administrators can update organization details" },
        { status: 403 }
      );
    }

    // Parse and validate the request body
    const body = await req.json();
    const result = updateOrgSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.format() },
        { status: 400 }
      );
    }

    const { name, type } = result.data;

    // Check if changing organization type would cause issues
    if (type) {
      const currentOrg = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          _count: {
            select: {
              projects: true,
              items: true,
            },
          },
        },
      });

      if (currentOrg?.type !== type) {
        // Check if changing from CONTRACTOR to STORE with existing projects
        if (
          currentOrg?.type === OrganizationType.CONTRACTOR &&
          type === OrganizationType.STORE &&
          currentOrg._count.projects > 0
        ) {
          return NextResponse.json(
            {
              error:
                "Cannot change to STORE type because this organization has projects. Please delete all projects first.",
            },
            { status: 400 }
          );
        }

        // Check if changing from STORE to CONTRACTOR with existing items
        if (
          currentOrg?.type === OrganizationType.STORE &&
          type === OrganizationType.CONTRACTOR &&
          currentOrg._count.items > 0
        ) {
          return NextResponse.json(
            {
              error:
                "Cannot change to CONTRACTOR type because this organization has items. Please delete all items first.",
            },
            { status: 400 }
          );
        }
      }
    }

    // Update the organization
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        name,
        type,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Organization updated successfully",
      organization: updatedOrganization,
    });
  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    );
  }
}
