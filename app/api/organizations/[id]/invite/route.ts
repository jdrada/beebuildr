import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { MemberRole } from "@/lib/auth-utils";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Validate invitation request
const inviteSchema = z.object({
  userId: z.string().uuid().or(z.string().cuid()),
  role: z.enum([MemberRole.ADMIN, MemberRole.MEMBER, MemberRole.VIEWER]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user from the session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = params.id;

    // Check if the user is an admin of this organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
        role: MemberRole.ADMIN,
      },
      include: {
        organization: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You must be an admin to invite users" },
        { status: 403 }
      );
    }

    // Parse and validate the request body
    const body = await req.json();
    const result = inviteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.format() },
        { status: 400 }
      );
    }

    const { userId, role } = result.data;

    // Check if the user exists
    const userToInvite = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToInvite) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the user is already a member
    const existingMembership = await prisma.organizationMember.findFirst({
      where: {
        userId,
        organizationId,
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "User is already a member of this organization" },
        { status: 409 }
      );
    }

    // Create the membership
    const newMembership = await prisma.organizationMember.create({
      data: {
        userId,
        organizationId,
        role,
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

    // Return the new membership
    return NextResponse.json(
      {
        success: true,
        message: "User invited successfully",
        membership: {
          id: newMembership.id,
          role: newMembership.role,
          user: newMembership.user,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error inviting user:", error);
    return NextResponse.json(
      { error: "Failed to invite user" },
      { status: 500 }
    );
  }
}
