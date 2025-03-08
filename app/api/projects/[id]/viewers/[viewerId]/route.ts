import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkProjectEditPermission } from "@/lib/project-utils";

// DELETE /api/projects/[id]/viewers/[viewerId] - Remove a viewer from the project
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; viewerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: projectId, viewerId } = params;

    // Check if the user has edit permission for this project
    const permission = await checkProjectEditPermission(userId, projectId);
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    // Check if the viewer exists
    const viewer = await prisma.projectViewer.findUnique({
      where: { id: viewerId },
    });

    if (!viewer) {
      return NextResponse.json({ error: "Viewer not found" }, { status: 404 });
    }

    // Ensure the viewer is associated with this project
    if (viewer.projectId !== projectId) {
      return NextResponse.json(
        { error: "Viewer does not belong to this project" },
        { status: 400 }
      );
    }

    // Remove the viewer
    await prisma.projectViewer.delete({
      where: { id: viewerId },
    });

    return NextResponse.json({
      success: true,
      message: "Viewer removed successfully",
    });
  } catch (error) {
    console.error("Error removing project viewer:", error);
    return NextResponse.json(
      { error: "Failed to remove project viewer" },
      { status: 500 }
    );
  }
}
