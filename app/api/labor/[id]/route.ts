import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";
import { MemberRole } from "@prisma/client";

// Validate labor update
const updateLaborSchema = z.object({
  code: z.string().optional().nullable(),
  role: z.string().min(1, "Role is required").optional(),
  description: z.string().optional().nullable(),
  unit: z.string().min(1, "Unit is required").optional(),
  unitPrice: z
    .number()
    .nonnegative("Unit price must be non-negative")
    .optional(),
  isPublic: z.boolean().optional(),
});

// GET /api/labor/[id] - Get a single labor
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user from the session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const laborId = params.id;

    // Get the labor
    const labor = await prisma.labor.findUnique({
      where: { id: laborId },
    });

    if (!labor) {
      return NextResponse.json({ error: "Labor not found" }, { status: 404 });
    }

    // Check if the user is a member of this organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: labor.organizationId,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this organization" },
        { status: 403 }
      );
    }

    return NextResponse.json({ labor });
  } catch (error) {
    console.error("Error fetching labor:", error);
    return NextResponse.json(
      { error: "Failed to fetch labor" },
      { status: 500 }
    );
  }
}

// PUT /api/labor/[id] - Update a labor
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user from the session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const laborId = params.id;

    // Get the labor
    const labor = await prisma.labor.findUnique({
      where: { id: laborId },
    });

    if (!labor) {
      return NextResponse.json({ error: "Labor not found" }, { status: 404 });
    }

    // Check if the user is a member of this organization with appropriate permissions
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: labor.organizationId,
        role: {
          in: [MemberRole.ADMIN, MemberRole.MEMBER],
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You don't have permission to update this labor" },
        { status: 403 }
      );
    }

    // Parse and validate the request body
    const body = await req.json();
    const validationResult = updateLaborSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Start a transaction to update the labor and all UPAs that use it
    const updatedLabor = await prisma.$transaction(async (tx) => {
      // Update the labor
      const updated = await tx.labor.update({
        where: { id: laborId },
        data,
      });

      // If the unit price has changed, update all UPAs that use this labor
      if (data.unitPrice !== undefined) {
        // Find all UPA labor that reference this labor
        const upaLabor = await tx.uPALabor.findMany({
          where: { laborId },
          include: { unitPriceAnalysis: true },
        });

        // Update each UPA labor with the new unit price and recalculate total price
        for (const labor of upaLabor) {
          await tx.uPALabor.update({
            where: { id: labor.id },
            data: {
              unitPrice: data.unitPrice,
              totalPrice: Number(labor.quantity) * data.unitPrice,
            },
          });

          // Recalculate the total price of the UPA
          const updatedUPAMaterials = await tx.uPAMaterial.findMany({
            where: { unitPriceAnalysisId: labor.unitPriceAnalysisId },
          });

          const updatedUPALabor = await tx.uPALabor.findMany({
            where: { unitPriceAnalysisId: labor.unitPriceAnalysisId },
          });

          const updatedUPAEquipment = await tx.uPAEquipment.findMany({
            where: { unitPriceAnalysisId: labor.unitPriceAnalysisId },
          });

          // Calculate the new total price
          const materialTotal = updatedUPAMaterials.reduce(
            (sum, m) => sum + Number(m.totalPrice),
            0
          );
          const laborTotal = updatedUPALabor.reduce(
            (sum, l) => sum + Number(l.totalPrice),
            0
          );
          const equipmentTotal = updatedUPAEquipment.reduce(
            (sum, e) => sum + Number(e.totalPrice),
            0
          );

          const newTotalPrice = materialTotal + laborTotal + equipmentTotal;

          // Update the UPA with the new total price
          await tx.unitPriceAnalysis.update({
            where: { id: labor.unitPriceAnalysisId },
            data: { totalPrice: newTotalPrice },
          });
        }
      }

      return updated;
    });

    return NextResponse.json({ labor: updatedLabor });
  } catch (error) {
    console.error("Error updating labor:", error);
    return NextResponse.json(
      { error: "Failed to update labor" },
      { status: 500 }
    );
  }
}

// DELETE /api/labor/[id] - Delete a labor
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user from the session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const laborId = params.id;

    // Get the labor
    const labor = await prisma.labor.findUnique({
      where: { id: laborId },
    });

    if (!labor) {
      return NextResponse.json({ error: "Labor not found" }, { status: 404 });
    }

    // Check if the user is a member of this organization with appropriate permissions
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: labor.organizationId,
        role: {
          in: [MemberRole.ADMIN, MemberRole.MEMBER],
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You don't have permission to delete this labor" },
        { status: 403 }
      );
    }

    // Check if the labor is used in any UPAs
    const upaLaborCount = await prisma.uPALabor.count({
      where: { laborId },
    });

    if (upaLaborCount > 0) {
      return NextResponse.json(
        {
          error:
            "This labor is used in unit price analyses and cannot be deleted",
          usageCount: upaLaborCount,
        },
        { status: 400 }
      );
    }

    // Delete the labor
    await prisma.labor.delete({
      where: { id: laborId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting labor:", error);
    return NextResponse.json(
      { error: "Failed to delete labor" },
      { status: 500 }
    );
  }
}
