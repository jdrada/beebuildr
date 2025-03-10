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

// Validate UPA creation request
const createUPASchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  code: z.string().optional(),
  unit: z.string().min(1),
  hasAnnualMaintenance: z.boolean().default(false),
  maintenanceYears: z.number().int().positive().optional().nullable(),
  annualMaintenanceRate: z.number().min(0).max(100).optional().nullable(),
  totalPrice: z.number(),
  materials: z.array(
    z.object({
      code: z.string().optional(),
      name: z.string().min(1),
      description: z.string().optional(),
      quantity: z.number().positive(),
      unit: z.string().min(1),
      unitPrice: z.number().nonnegative(),
      totalPrice: z.number().nonnegative(),
      materialId: z.string().optional(),
    })
  ),
  labor: z.array(
    z.object({
      code: z.string().optional(),
      role: z.string().min(1),
      description: z.string().optional(),
      quantity: z.number().positive(),
      unit: z.string().min(1),
      unitPrice: z.number().nonnegative(),
      totalPrice: z.number().nonnegative(),
      laborId: z.string().optional(),
    })
  ),
  equipment: z.array(
    z.object({
      code: z.string().optional(),
      name: z.string().min(1),
      description: z.string().optional(),
      quantity: z.number().positive(),
      unit: z.string().min(1),
      unitPrice: z.number().nonnegative(),
      totalPrice: z.number().nonnegative(),
      equipmentId: z.string().optional(),
    })
  ),
  organizationId: z.string().min(1),
});

// GET /api/unit-price-analyses - Get all UPAs (with filters)
export async function GET(req: NextRequest) {
  try {
    // Get the current user from the session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const organizationId = searchParams.get("organizationId");
    const isPublic = searchParams.get("isPublic") === "true";

    // Build the where clause
    let where: any = {};

    if (organizationId) {
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

      where.organizationId = organizationId;
    } else {
      // If no organization specified, only show public UPAs
      where.isPublic = true;
    }

    // If isPublic is specified, filter by it
    if (searchParams.has("isPublic")) {
      where.isPublic = isPublic;
    }

    // Get all UPAs matching the criteria
    const unitPriceAnalyses = await prisma.unitPriceAnalysis.findMany({
      where,
      include: {
        materials: true,
        labor: true,
        equipment: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({ unitPriceAnalyses });
  } catch (error) {
    console.error("Error fetching unit price analyses:", error);
    return NextResponse.json(
      { error: "Failed to fetch unit price analyses" },
      { status: 500 }
    );
  }
}

// POST /api/unit-price-analyses - Create a new UPA
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const body = createUPASchema.parse(json);

    const upa = await prisma.unitPriceAnalysis.create({
      data: {
        title: body.title,
        description: body.description,
        code: body.code,
        unit: body.unit,
        hasAnnualMaintenance: body.hasAnnualMaintenance,
        maintenanceYears: body.maintenanceYears,
        annualMaintenanceRate: body.annualMaintenanceRate,
        totalPrice: body.totalPrice,
        organizationId: body.organizationId,
        materials: {
          create: body.materials.map((material) => ({
            code: material.code,
            name: material.name,
            description: material.description,
            quantity: material.quantity,
            unit: material.unit,
            unitPrice: material.unitPrice,
            totalPrice: material.totalPrice,
            materialId: material.materialId,
          })),
        },
        labor: {
          create: body.labor.map((labor) => ({
            code: labor.code,
            role: labor.role,
            description: labor.description,
            quantity: labor.quantity,
            unit: labor.unit,
            unitPrice: labor.unitPrice,
            totalPrice: labor.totalPrice,
            laborId: labor.laborId,
          })),
        },
        equipment: {
          create: body.equipment.map((equipment) => ({
            code: equipment.code,
            name: equipment.name,
            description: equipment.description,
            quantity: equipment.quantity,
            unit: equipment.unit,
            unitPrice: equipment.unitPrice,
            totalPrice: equipment.totalPrice,
            equipmentId: equipment.equipmentId,
          })),
        },
      },
    });

    return new Response(JSON.stringify(upa), { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 });
    }

    return new Response(null, { status: 500 });
  }
}
