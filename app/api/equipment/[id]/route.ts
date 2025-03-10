import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";
import { MemberRole } from "@prisma/client";

// Validate equipment update
const updateEquipmentSchema = z.object({
  code: z.string().optional().nullable(),
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional().nullable(),
  unit: z.string().min(1, "Unit is required").optional(),
  unitPrice: z
    .number()
    .nonnegative("Unit price must be non-negative")
    .optional(),
  isPublic: z.boolean().optional(),
});

// GET /api/equipment/[id] - Get a single equipment
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

    const equipmentId = params.id;

    // Get the equipment
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
    });

    if (!equipment) {
      return NextResponse.json(
        { error: "Equipment not found" },
        { status: 404 }
      );
    }

    // Check if the user is a member of this organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: equipment.organizationId,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this organization" },
        { status: 403 }
      );
    }

    return NextResponse.json({ equipment });
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json(
      { error: "Failed to fetch equipment" },
      { status: 500 }
    );
  }
}

// PUT /api/equipment/[id] - Update equipment
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

    const equipmentId = params.id;

    // Get the equipment
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
    });

    if (!equipment) {
      return NextResponse.json(
        { error: "Equipment not found" },
        { status: 404 }
      );
    }

    // Check if the user is a member of this organization with appropriate permissions
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: equipment.organizationId,
        role: {
          in: [MemberRole.ADMIN, MemberRole.MEMBER],
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You don't have permission to update this equipment" },
        { status: 403 }
      );
    }

    // Parse and validate the request body
    const body = await req.json();
    const validationResult = updateEquipmentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Start a transaction to update the equipment and all UPAs that use it
    const updatedEquipment = await prisma.$transaction(async (tx) => {
      // Update the equipment
      const updated = await tx.equipment.update({
        where: { id: equipmentId },
        data,
      });

      // If the unit price has changed, update all UPAs that use this equipment
      if (data.unitPrice !== undefined) {
        // Find all UPA equipment that reference this equipment
        const upaEquipment = await tx.uPAEquipment.findMany({
          where: { equipmentId },
          include: { unitPriceAnalysis: true },
        });

        // Update each UPA equipment with the new unit price and recalculate total price
        for (const equipment of upaEquipment) {
          await tx.uPAEquipment.update({
            where: { id: equipment.id },
            data: {
              unitPrice: data.unitPrice,
              totalPrice: Number(equipment.quantity) * data.unitPrice,
            },
          });

          // Recalculate the total price of the UPA
          const updatedUPAMaterials = await tx.uPAMaterial.findMany({
            where: { unitPriceAnalysisId: equipment.unitPriceAnalysisId },
          });

          const updatedUPALabor = await tx.uPALabor.findMany({
            where: { unitPriceAnalysisId: equipment.unitPriceAnalysisId },
          });

          const updatedUPAEquipment = await tx.uPAEquipment.findMany({
            where: { unitPriceAnalysisId: equipment.unitPriceAnalysisId },
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
            where: { id: equipment.unitPriceAnalysisId },
            data: { totalPrice: newTotalPrice },
          });
        }
      }

      return updated;
    });

    return NextResponse.json({ equipment: updatedEquipment });
  } catch (error) {
    console.error("Error updating equipment:", error);
    return NextResponse.json(
      { error: "Failed to update equipment" },
      { status: 500 }
    );
  }
}

// DELETE /api/equipment/[id] - Delete equipment
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

    const equipmentId = params.id;

    // Get the equipment
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
    });

    if (!equipment) {
      return NextResponse.json(
        { error: "Equipment not found" },
        { status: 404 }
      );
    }

    // Check if the user is a member of this organization with appropriate permissions
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: equipment.organizationId,
        role: {
          in: [MemberRole.ADMIN, MemberRole.MEMBER],
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You don't have permission to delete this equipment" },
        { status: 403 }
      );
    }

    // Check if the equipment is used in any UPAs
    const upaEquipmentCount = await prisma.uPAEquipment.count({
      where: { equipmentId },
    });

    if (upaEquipmentCount > 0) {
      return NextResponse.json(
        {
          error:
            "This equipment is used in unit price analyses and cannot be deleted",
          usageCount: upaEquipmentCount,
        },
        { status: 400 }
      );
    }

    // Delete the equipment
    await prisma.equipment.delete({
      where: { id: equipmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting equipment:", error);
    return NextResponse.json(
      { error: "Failed to delete equipment" },
      { status: 500 }
    );
  }
}
