import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { canCreateProjects } from "@/lib/project-utils";
import { checkProjectLimit } from "@/lib/organization-utils";

// Define the project status enum directly
const ProjectStatus = {
  PLANNING: "PLANNING",
  IN_PROGRESS: "IN_PROGRESS",
  ON_HOLD: "ON_HOLD",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

// Define the project type enum directly
const ProjectType = {
  RESIDENTIAL: "RESIDENTIAL",
  COMMERCIAL: "COMMERCIAL",
  INDUSTRIAL: "INDUSTRIAL",
  INSTITUTIONAL: "INSTITUTIONAL",
  INFRASTRUCTURE: "INFRASTRUCTURE",
  RENOVATION: "RENOVATION",
  OTHER: "OTHER",
} as const;

// Validate project creation request
const projectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z
    .enum([
      ProjectStatus.PLANNING,
      ProjectStatus.IN_PROGRESS,
      ProjectStatus.ON_HOLD,
      ProjectStatus.COMPLETED,
      ProjectStatus.CANCELLED,
    ])
    .optional(),

  // Client Information
  clientName: z.string().optional(),
  contactPerson: z.string().optional(),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email().optional().nullable(),
  billingAddress: z.string().optional(),

  // Project Information
  projectAddress: z.string().optional(),
  projectType: z
    .enum([
      ProjectType.RESIDENTIAL,
      ProjectType.COMMERCIAL,
      ProjectType.INDUSTRIAL,
      ProjectType.INSTITUTIONAL,
      ProjectType.INFRASTRUCTURE,
      ProjectType.RENOVATION,
      ProjectType.OTHER,
    ])
    .optional(),
  projectScope: z.string().optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),

  organizationId: z.string().cuid(),
});

// GET /api/projects - List projects the user has access to
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get the organization ID from query params or active organization
    const { searchParams } = new URL(req.url);
    const organizationId =
      searchParams.get("organizationId") || session.activeOrganizationId;

    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization specified" },
        { status: 400 }
      );
    }

    // Check membership to determine which projects to show
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId,
        organizationId,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this organization" },
        { status: 403 }
      );
    }

    let projects;

    // For admin and members, show all projects in the organization
    if (membership.role === "ADMIN" || membership.role === "MEMBER") {
      projects = await prisma.project.findMany({
        where: {
          organizationId,
        },
        include: {
          organization: {
            select: {
              name: true,
              type: true,
            },
          },
          createdBy: {
            select: {
              name: true,
              username: true,
            },
          },
          budgetProjects: {
            include: {
              budget: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    } else {
      // For viewers, only show projects they have access to
      projects = await prisma.project.findMany({
        where: {
          OR: [
            {
              organizationId,
              createdById: userId,
            },
            {
              organizationId,
              viewers: {
                some: {
                  userId,
                },
              },
            },
          ],
        },
        include: {
          organization: {
            select: {
              name: true,
              type: true,
            },
          },
          createdBy: {
            select: {
              name: true,
              username: true,
            },
          },
          budgetProjects: {
            include: {
              budget: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    }

    // After the if/else block that sets the projects variable
    // Make sure projects is always an array
    projects = projects || [];

    // Log the number of projects found
    console.log(
      `Found ${projects.length} projects for user ${userId} in organization ${organizationId}`
    );

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);

    // Provide more detailed error information
    const errorMessage =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : "Unknown error";

    console.error("Detailed error:", errorMessage);

    return NextResponse.json(
      {
        error: "Failed to fetch projects",
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse and validate the request body
    const body = await req.json();
    const result = projectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.format() },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      status,
      clientName,
      contactPerson,
      clientPhone,
      clientEmail,
      billingAddress,
      projectAddress,
      projectType,
      projectScope,
      startDate,
      endDate,
      organizationId,
    } = result.data;

    // Check if the user can create projects in this organization
    const canCreate = await canCreateProjects(userId, organizationId);
    if (!canCreate) {
      return NextResponse.json(
        {
          error:
            "You don't have permission to create projects in this organization",
        },
        { status: 403 }
      );
    }

    // Check if the organization has reached its project limit
    const projectLimit = await checkProjectLimit(organizationId);
    if (projectLimit.limitReached) {
      return NextResponse.json(
        {
          error: "Project limit reached",
          details: `Your organization has reached the limit of ${projectLimit.limit} projects. Please upgrade your plan to create more projects.`,
          limit: projectLimit.limit,
          total: projectLimit.total,
        },
        { status: 403 }
      );
    }

    // Create the project
    const project = await prisma.project.create({
      data: {
        name,
        description,
        status: status || ProjectStatus.PLANNING,

        // Client Information
        clientName,
        contactPerson,
        clientPhone,
        clientEmail,
        billingAddress,

        // Project Information
        projectAddress,
        projectType,
        projectScope,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,

        organizationId,
        createdById: userId,
      },
      include: {
        organization: {
          select: {
            name: true,
            type: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Project created successfully",
        project,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
