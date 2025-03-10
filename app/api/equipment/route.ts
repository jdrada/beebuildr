import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";
import { MemberRole, OrganizationType, Prisma } from "@prisma/client";

// Validate equipment
const equipmentSchema = z.object({
  code: z.string().optional().nullable(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z.number().nonnegative("Unit price must be non-negative"),
  isPublic: z.boolean().default(false),
});

// GET /api/equipment - Get all equipment for the active organization
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

    // Check if the organization is a contractor
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (organization?.type !== OrganizationType.CONTRACTOR) {
      return NextResponse.json(
        { error: "Only contractor organizations can manage equipment" },
        { status: 403 }
      );
    }

    // Build the where clause
    const where: Prisma.EquipmentWhereInput = { organizationId };

    // If isPublic is specified, filter by it
    if (searchParams.has("isPublic")) {
      where.isPublic = isPublic;
    }

    // Get all equipment for this organization
    const equipment = await prisma.equipment.findMany({
      where,
      include: {
        _count: {
          select: { upaEquipment: true },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Transform the response to include usage information
    const equipmentWithUsage = equipment.map((item) => ({
      ...item,
      usageCount: item._count.upaEquipment,
      inUse: item._count.upaEquipment > 0,
    }));

    return NextResponse.json({ equipment: equipmentWithUsage });
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json(
      { error: "Failed to fetch equipment" },
      { status: 500 }
    );
  }
}

// POST /api/equipment - Create a new equipment
export async function POST(req: NextRequest) {
  try {
    // Get the current user from the session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate the request body
    const body = await req.json();
    const validationResult = equipmentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Check if the user is a member of this organization with appropriate permissions
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
        role: {
          in: [MemberRole.ADMIN, MemberRole.MEMBER],
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        {
          error:
            "You don't have permission to create equipment for this organization",
        },
        { status: 403 }
      );
    }

    // Check if the organization is a contractor
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (organization?.type !== OrganizationType.CONTRACTOR) {
      return NextResponse.json(
        { error: "Only contractor organizations can create equipment" },
        { status: 403 }
      );
    }

    // Create the equipment
    const equipment = await prisma.equipment.create({
      data: {
        code: body.code,
        name: body.name,
        description: body.description,
        unit: body.unit,
        unitPrice: body.unitPrice,
        isPublic: body.isPublic || false,
        organizationId,
      },
    });

    return NextResponse.json({ equipment }, { status: 201 });
  } catch (error) {
    console.error("Error creating equipment:", error);
    return NextResponse.json(
      { error: "Failed to create equipment" },
      { status: 500 }
    );
  }
}
