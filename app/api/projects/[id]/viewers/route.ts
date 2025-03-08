import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkProjectEditPermission } from "@/lib/project-utils";
import { MemberRole } from "@/lib/auth-utils";

// Validate viewer addition
const addViewerSchema = z.object({
  userId: z.string().cuid(),
});

// GET /api/projects/[id]/viewers - List project viewers
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const projectId = params.id;

    // Check if the user has edit permission for this project
    const permission = await checkProjectEditPermission(userId, projectId);
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    // Get all viewers for this project
    const viewers = await prisma.projectViewer.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ viewers });
  } catch (error) {
    console.error("Error fetching project viewers:", error);
    return NextResponse.json(
      { error: "Failed to fetch project viewers" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/viewers - Add a viewer to the project
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const projectId = params.id;

    // Check if the user has edit permission for this project
    const permission = await checkProjectEditPermission(userId, projectId);
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    // Parse and validate the request body
    const body = await req.json();
    const result = addViewerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.format() },
        { status: 400 }
      );
    }

    const { userId: viewerUserId } = result.data;

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: viewerUserId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if this user is already a viewer of this project
    const existingViewer = await prisma.projectViewer.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: viewerUserId,
        },
      },
    });

    if (existingViewer) {
      return NextResponse.json(
        { error: "User is already a viewer of this project" },
        { status: 409 }
      );
    }

    // Check if the user is a member of the same organization
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: viewerUserId,
        organizationId: project.organizationId,
      },
    });

    // If the user is not a member, or is already an ADMIN or MEMBER, they don't need viewer access
    if (!membership) {
      return NextResponse.json(
        { error: "User is not a member of the organization" },
        { status: 400 }
      );
    }

    if (membership.role !== MemberRole.VIEWER) {
      return NextResponse.json(
        { error: "Only viewers need explicit project access" },
        { status: 400 }
      );
    }

    // Add the user as a viewer of the project
    const projectViewer = await prisma.projectViewer.create({
      data: {
        projectId,
        userId: viewerUserId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Viewer added successfully",
        viewer: projectViewer,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding project viewer:", error);
    return NextResponse.json(
      { error: "Failed to add project viewer" },
      { status: 500 }
    );
  }
}
