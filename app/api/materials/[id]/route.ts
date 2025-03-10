import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";
import { MemberRole } from "@prisma/client";

// Validate material update
const updateMaterialSchema = z.object({
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

// GET /api/materials/[id] - Get a single material
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

    const materialId = params.id;

    // Get the material
    const material = await prisma.material.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    // Check if the user is a member of this organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: material.organizationId,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this organization" },
        { status: 403 }
      );
    }

    return NextResponse.json({ material });
  } catch (error) {
    console.error("Error fetching material:", error);
    return NextResponse.json(
      { error: "Failed to fetch material" },
      { status: 500 }
    );
  }
}

// PUT /api/materials/[id] - Update a material
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

    const materialId = params.id;

    // Get the material
    const material = await prisma.material.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    // Check if the user is a member of this organization with appropriate permissions
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: material.organizationId,
        role: {
          in: [MemberRole.ADMIN, MemberRole.MEMBER],
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You don't have permission to update this material" },
        { status: 403 }
      );
    }

    // Parse and validate the request body
    const body = await req.json();
    const validationResult = updateMaterialSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Start a transaction to update the material and all UPAs that use it
    const updatedMaterial = await prisma.$transaction(async (tx) => {
      // Update the material
      const updated = await tx.material.update({
        where: { id: materialId },
        data,
      });

      // If the unit price has changed, update all UPAs that use this material
      if (data.unitPrice !== undefined) {
        // Find all UPA materials that reference this material
        const upaMaterials = await tx.uPAMaterial.findMany({
          where: { materialId },
          include: { unitPriceAnalysis: true },
        });

        // Update each UPA material with the new unit price and recalculate total price
        for (const upaMaterial of upaMaterials) {
          await tx.uPAMaterial.update({
            where: { id: upaMaterial.id },
            data: {
              unitPrice: data.unitPrice,
              totalPrice: Number(upaMaterial.quantity) * data.unitPrice,
            },
          });

          // Recalculate the total price of the UPA
          const updatedUPAMaterials = await tx.uPAMaterial.findMany({
            where: { unitPriceAnalysisId: upaMaterial.unitPriceAnalysisId },
          });

          const updatedUPALabor = await tx.uPALabor.findMany({
            where: { unitPriceAnalysisId: upaMaterial.unitPriceAnalysisId },
          });

          const updatedUPAEquipment = await tx.uPAEquipment.findMany({
            where: { unitPriceAnalysisId: upaMaterial.unitPriceAnalysisId },
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
            where: { id: upaMaterial.unitPriceAnalysisId },
            data: { totalPrice: newTotalPrice },
          });
        }
      }

      return updated;
    });

    return NextResponse.json({ material: updatedMaterial });
  } catch (error) {
    console.error("Error updating material:", error);
    return NextResponse.json(
      { error: "Failed to update material" },
      { status: 500 }
    );
  }
}

// DELETE /api/materials/[id] - Delete a material
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

    const materialId = params.id;

    // Get the material
    const material = await prisma.material.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    // Check if the user is a member of this organization with appropriate permissions
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: material.organizationId,
        role: {
          in: [MemberRole.ADMIN, MemberRole.MEMBER],
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You don't have permission to delete this material" },
        { status: 403 }
      );
    }

    // Check if the material is used in any UPAs
    const upaMaterialsCount = await prisma.uPAMaterial.count({
      where: { materialId },
    });

    if (upaMaterialsCount > 0) {
      return NextResponse.json(
        {
          error:
            "This material is used in unit price analyses and cannot be deleted",
          usageCount: upaMaterialsCount,
        },
        { status: 400 }
      );
    }

    // Delete the material
    await prisma.material.delete({
      where: { id: materialId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting material:", error);
    return NextResponse.json(
      { error: "Failed to delete material" },
      { status: 500 }
    );
  }
}
