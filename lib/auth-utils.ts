import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "./prisma";

// Enum definitions to avoid importing from Prisma client
export enum MemberRole {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
  VIEWER = "VIEWER",
}

export enum OrganizationType {
  CONTRACTOR = "CONTRACTOR",
  STORE = "STORE",
}

export type PermissionResult =
  | { allowed: false; error: string; status: number }
  | { allowed: true; membership: unknown; organization: unknown };

/**
 * Check if the user is authenticated
 */
export async function requireAuth() {
  const session = await getServerSession();

  if (!session?.user) {
    return {
      authenticated: false,
      error: "Unauthorized",
      status: 401,
    };
  }

  return {
    authenticated: true,
    session,
  };
}

/**
 * Check if the user has an active organization
 */
export async function requireActiveOrganization() {
  const authResult = await requireAuth();

  if (!authResult.authenticated) {
    return {
      authenticated: false,
      hasActiveOrg: false,
      error: authResult.error,
      status: authResult.status,
    };
  }

  if (!authResult.session?.activeOrganizationId) {
    return {
      authenticated: true,
      hasActiveOrg: false,
      error: "No active organization selected",
      status: 400,
    };
  }

  return {
    authenticated: true,
    hasActiveOrg: true,
    session: authResult.session,
  };
}

/**
 * Check if the user has permission within an organization
 */
export async function checkOrgPermission(
  userId: string,
  organizationId: string,
  requiredRoles: MemberRole[] = [MemberRole.ADMIN, MemberRole.MEMBER]
): Promise<PermissionResult> {
  // Get the organization
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!organization) {
    return {
      allowed: false,
      error: "Organization not found",
      status: 404,
    };
  }

  // Find the user's membership in the organization
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId,
    },
  });

  if (!membership) {
    return {
      allowed: false,
      error: "You are not a member of this organization",
      status: 403,
    };
  }

  // Check if the user has the required role
  if (!requiredRoles.includes(membership.role as MemberRole)) {
    return {
      allowed: false,
      error: "You don't have permission to perform this action",
      status: 403,
    };
  }

  return {
    allowed: true,
    organization,
    membership,
  };
}

/**
 * Check if the organization is of the required type
 */
export async function checkOrgType(
  organizationId: string,
  requiredType: OrganizationType
): Promise<boolean> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  return organization?.type === requiredType;
}

/**
 * Create a JSON response for errors
 */
export function createErrorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

/**
 * Switch the active organization
 */
export async function switchActiveOrganization(
  userId: string,
  organizationId: string
) {
  const permissionCheck = await checkOrgPermission(userId, organizationId, [
    MemberRole.ADMIN,
    MemberRole.MEMBER,
    MemberRole.VIEWER,
  ]);

  if (!permissionCheck.allowed) {
    return {
      success: false,
      error: permissionCheck.error,
      status: permissionCheck.status,
    };
  }

  return {
    success: true,
    organization: permissionCheck.organization,
    membership: permissionCheck.membership,
  };
}
