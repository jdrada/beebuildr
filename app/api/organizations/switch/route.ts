import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  requireAuth,
  switchActiveOrganization,
  createErrorResponse,
} from "@/lib/auth-utils";

const switchSchema = z.object({
  organizationId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth();
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.error, authResult.status);
    }

    // Parse request body
    const body = await req.json();
    const result = switchSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.format() },
        { status: 400 }
      );
    }

    const { organizationId } = result.data;

    // Attempt to switch the active organization
    const switchResult = await switchActiveOrganization(
      authResult.session.user.id,
      organizationId
    );

    if (!switchResult.success) {
      return createErrorResponse(switchResult.error, switchResult.status);
    }

    // Update the session with the new active organization
    authResult.session.activeOrganizationId = organizationId;

    return NextResponse.json({
      success: true,
      activeOrganization: {
        id: switchResult.organization.id,
        name: switchResult.organization.name,
        type: switchResult.organization.type,
        role: switchResult.membership.role,
      },
    });
  } catch (error) {
    console.error("Error switching organizations:", error);
    return NextResponse.json(
      { error: "Failed to switch organizations" },
      { status: 500 }
    );
  }
}
