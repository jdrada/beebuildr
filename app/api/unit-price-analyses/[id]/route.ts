import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";
import { MemberRole } from "@prisma/client";

// Validate UPA material
const upaMaterialSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z.number().nonnegative("Unit price must be non-negative"),
  totalPrice: z.number().nonnegative("Total price must be non-negative"),
});

// Validate UPA labor
const upaLaborSchema = z.object({
  id: z.string().optional(),
  role: z.string().min(1, "Role is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z.number().nonnegative("Unit price must be non-negative"),
  totalPrice: z.number().nonnegative("Total price must be non-negative"),
});

// Validate UPA equipment
const upaEquipmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z.number().nonnegative("Unit price must be non-negative"),
  totalPrice: z.number().nonnegative("Total price must be non-negative"),
});

// Validate UPA update request
const updateUPASchema = z.object({
  title: z.string().min(1, "Title is required").max(255).optional(),
  description: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  unit: z.string().min(1, "Unit is required").optional(),
  materials: z.array(upaMaterialSchema).optional(),
  labor: z.array(upaLaborSchema).optional(),
  equipment: z.array(upaEquipmentSchema).optional(),
});

// Helper function to check if user has permission to access a UPA
async function checkUPAPermission(userId: string, upaId: string) {
  // Get the UPA
  const upa = await prisma.unitPriceAnalysis.findUnique({
    where: { id: upaId },
    select: {
      organizationId: true,
      isPublic: true,
    },
  });

  if (!upa) {
    return {
      allowed: false,
      error: "Unit price analysis not found",
      status: 404,
    };
  }

  // If UPA is public, allow access
  if (upa.isPublic) {
    return { allowed: true };
  }

  // Check if user is a member of the organization
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId: upa.organizationId,
    },
  });

  if (!membership) {
    return {
      allowed: false,
      error: "You don't have permission to access this unit price analysis",
      status: 403,
    };
  }

  return { allowed: true };
}

// Helper function to check if user can edit a UPA
async function checkUPAEditPermission(userId: string, upaId: string) {
  // Get the UPA
  const upa = await prisma.unitPriceAnalysis.findUnique({
    where: { id: upaId },
    select: {
      organizationId: true,
      isPublic: true,
    },
  });

  if (!upa) {
    return {
      allowed: false,
      error: "Unit price analysis not found",
      status: 404,
    };
  }

  // If UPA is public, only SaaS admins can edit it (not implemented yet)
  if (upa.isPublic) {
    return {
      allowed: false,
      error:
        "You don't have permission to edit this public unit price analysis",
      status: 403,
    };
  }

  // Check if user is an admin or member of the organization
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId: upa.organizationId,
      role: {
        in: [MemberRole.ADMIN, MemberRole.MEMBER],
      },
    },
  });

  if (!membership) {
    return {
      allowed: false,
      error: "You don't have permission to edit this unit price analysis",
      status: 403,
    };
  }

  return { allowed: true };
}

// GET /api/unit-price-analyses/[id] - Get a single UPA
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

    const upaId = params.id;

    // Check if the user has permission to view this UPA
    const permission = await checkUPAPermission(session.user.id, upaId);
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    // Get the UPA with all its components
    const unitPriceAnalysis = await prisma.unitPriceAnalysis.findUnique({
      where: { id: upaId },
      include: {
        materials: true,
        labor: true,
        equipment: true,
      },
    });

    if (!unitPriceAnalysis) {
      return NextResponse.json(
        { error: "Unit price analysis not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ unitPriceAnalysis });
  } catch (error) {
    console.error("Error fetching unit price analysis:", error);
    return NextResponse.json(
      { error: "Failed to fetch unit price analysis" },
      { status: 500 }
    );
  }
}

// PATCH /api/unit-price-analyses/[id] - Update a UPA
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

    const upaId = params.id;

    // Check if the user has permission to edit this UPA
    const permission = await checkUPAEditPermission(session.user.id, upaId);
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    // Parse and validate the request body
    const body = await req.json();
    const result = updateUPASchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.format() },
        { status: 400 }
      );
    }

    const { title, description, code, unit, materials, labor, equipment } =
      result.data;

    // Get the current UPA to calculate the new total price
    const currentUPA = await prisma.unitPriceAnalysis.findUnique({
      where: { id: upaId },
      include: {
        materials: true,
        labor: true,
        equipment: true,
      },
    });

    if (!currentUPA) {
      return NextResponse.json(
        { error: "Unit price analysis not found" },
        { status: 404 }
      );
    }

    // Start a transaction to update the UPA and its components
    const updatedUPA = await prisma.$transaction(async (tx) => {
      // Update materials if provided
      if (materials) {
        // Delete existing materials
        await tx.uPAMaterial.deleteMany({
          where: { unitPriceAnalysisId: upaId },
        });

        // Create new materials
        await Promise.all(
          materials.map((material) =>
            tx.uPAMaterial.create({
              data: {
                name: material.name,
                quantity: material.quantity,
                unit: material.unit,
                unitPrice: material.unitPrice,
                totalPrice: material.totalPrice,
                unitPriceAnalysisId: upaId,
              },
            })
          )
        );
      }

      // Update labor if provided
      if (labor) {
        // Delete existing labor
        await tx.uPALabor.deleteMany({
          where: { unitPriceAnalysisId: upaId },
        });

        // Create new labor
        await Promise.all(
          labor.map((item) =>
            tx.uPALabor.create({
              data: {
                role: item.role,
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                unitPriceAnalysisId: upaId,
              },
            })
          )
        );
      }

      // Update equipment if provided
      if (equipment) {
        // Delete existing equipment
        await tx.uPAEquipment.deleteMany({
          where: { unitPriceAnalysisId: upaId },
        });

        // Create new equipment
        await Promise.all(
          equipment.map((item) =>
            tx.uPAEquipment.create({
              data: {
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                unitPriceAnalysisId: upaId,
              },
            })
          )
        );
      }

      // Calculate the new total price
      const materialsTotal = materials
        ? materials.reduce((sum, item) => sum + item.totalPrice, 0)
        : currentUPA.materials.reduce(
            (sum, item) => sum + Number(item.totalPrice),
            0
          );

      const laborTotal = labor
        ? labor.reduce((sum, item) => sum + item.totalPrice, 0)
        : currentUPA.labor.reduce(
            (sum, item) => sum + Number(item.totalPrice),
            0
          );

      const equipmentTotal = equipment
        ? equipment.reduce((sum, item) => sum + item.totalPrice, 0)
        : currentUPA.equipment.reduce(
            (sum, item) => sum + Number(item.totalPrice),
            0
          );

      const totalPrice = materialsTotal + laborTotal + equipmentTotal;

      // Update the UPA
      return tx.unitPriceAnalysis.update({
        where: { id: upaId },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(code !== undefined && { code }),
          ...(unit && { unit }),
          totalPrice,
          updatedAt: new Date(),
        },
        include: {
          materials: true,
          labor: true,
          equipment: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Unit price analysis updated successfully",
      unitPriceAnalysis: updatedUPA,
    });
  } catch (error) {
    console.error("Error updating unit price analysis:", error);
    return NextResponse.json(
      { error: "Failed to update unit price analysis" },
      { status: 500 }
    );
  }
}

// DELETE /api/unit-price-analyses/[id] - Delete a UPA
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

    const upaId = params.id;

    // Check if the user has permission to edit this UPA
    const permission = await checkUPAEditPermission(session.user.id, upaId);
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    // Get the UPA to return its organization ID
    const upa = await prisma.unitPriceAnalysis.findUnique({
      where: { id: upaId },
      select: {
        organizationId: true,
      },
    });

    if (!upa) {
      return NextResponse.json(
        { error: "Unit price analysis not found" },
        { status: 404 }
      );
    }

    // Delete the UPA (cascade will delete materials, labor, and equipment)
    await prisma.unitPriceAnalysis.delete({
      where: { id: upaId },
    });

    return NextResponse.json({
      success: true,
      message: "Unit price analysis deleted successfully",
      organizationId: upa.organizationId,
    });
  } catch (error) {
    console.error("Error deleting unit price analysis:", error);
    return NextResponse.json(
      { error: "Failed to delete unit price analysis" },
      { status: 500 }
    );
  }
}
