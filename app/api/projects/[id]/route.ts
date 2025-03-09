import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  checkProjectViewPermission,
  checkProjectEditPermission,
  checkProjectDeletePermission,
} from "@/lib/project-utils";
import { ProjectStatus, ProjectType } from "@prisma/client";

// GET /api/projects/[id] - Get a single project
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

    // Check if the user has permission to view this project
    const permission = await checkProjectViewPermission(userId, projectId);
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    // Get the project with details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        budgetProjects: {
          include: {
            budget: {
              select: {
                id: true,
                title: true,
                description: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            image: true,
          },
        },
        viewers: {
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
        },
        _count: {
          select: {
            viewers: true,
          },
        },
      },
    });

    // Add user's permission level to the response
    const userPermission = permission.membership.role;

    return NextResponse.json({
      project,
      userPermission,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id] - Update a project
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

    const userId = session.user.id;
    const projectId = params.id;

    // Check if the user has permission to edit this project
    const permission = await checkProjectEditPermission(userId, projectId);
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    // Parse and validate the request body
    const body = await req.json();

    // Extract the fields to update
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
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
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
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        updatedAt: new Date(),
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

    return NextResponse.json({
      success: true,
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
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

    // Check if the user has permission to delete this project
    const permission = await checkProjectDeletePermission(userId, projectId);
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    // Delete the project and all associated records
    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
