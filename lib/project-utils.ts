import { prisma } from "@/lib/prisma";
import { MemberRole, OrganizationType } from "@/lib/auth-utils";

export type ProjectPermissionResult =
  | { allowed: false; error: string; status: number }
  | { allowed: true; project: any; membership: any };

// Check if a user has permission to view a project
export async function checkProjectViewPermission(
  userId: string,
  projectId: string
): Promise<ProjectPermissionResult> {
  if (!userId || !projectId) {
    return {
      allowed: false,
      error: "Invalid user or project",
      status: 400,
    };
  }

  // Get the project with its organization
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { organization: true },
  });

  if (!project) {
    return {
      allowed: false,
      error: "Project not found",
      status: 404,
    };
  }

  // Check if the organization is of type CONTRACTOR
  if (project.organization.type !== OrganizationType.CONTRACTOR) {
    return {
      allowed: false,
      error: "Only contractor organizations can have projects",
      status: 403,
    };
  }

  // Check organization membership
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId: project.organizationId,
    },
  });

  // If user is an admin or member of the organization, they can view the project
  if (
    membership &&
    [MemberRole.ADMIN, MemberRole.MEMBER].includes(
      membership.role as MemberRole
    )
  ) {
    return {
      allowed: true,
      project,
      membership,
    };
  }

  // If the user is a viewer, check if they have been specifically granted access
  if (membership && membership.role === MemberRole.VIEWER) {
    // Check if the user has been explicitly added as a viewer for this project
    const projectViewer = await prisma.projectViewer.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (projectViewer) {
      return {
        allowed: true,
        project,
        membership,
      };
    }
  }

  // Otherwise, deny access
  return {
    allowed: false,
    error: "You don't have permission to view this project",
    status: 403,
  };
}

// Check if a user has permission to edit a project
export async function checkProjectEditPermission(
  userId: string,
  projectId: string
): Promise<ProjectPermissionResult> {
  if (!userId || !projectId) {
    return {
      allowed: false,
      error: "Invalid user or project",
      status: 400,
    };
  }

  // Get the project with its organization
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { organization: true },
  });

  if (!project) {
    return {
      allowed: false,
      error: "Project not found",
      status: 404,
    };
  }

  // Check if the organization is of type CONTRACTOR
  if (project.organization.type !== OrganizationType.CONTRACTOR) {
    return {
      allowed: false,
      error: "Only contractor organizations can have projects",
      status: 403,
    };
  }

  // Check organization membership
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId: project.organizationId,
    },
  });

  // Only admin and member roles can edit projects
  if (
    membership &&
    [MemberRole.ADMIN, MemberRole.MEMBER].includes(
      membership.role as MemberRole
    )
  ) {
    return {
      allowed: true,
      project,
      membership,
    };
  }

  // Otherwise, deny access
  return {
    allowed: false,
    error: "You don't have permission to modify this project",
    status: 403,
  };
}

// Check if a user has permission to delete a project
export async function checkProjectDeletePermission(
  userId: string,
  projectId: string
): Promise<ProjectPermissionResult> {
  if (!userId || !projectId) {
    return {
      allowed: false,
      error: "Invalid user or project",
      status: 400,
    };
  }

  // Get the project with its organization
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { organization: true },
  });

  if (!project) {
    return {
      allowed: false,
      error: "Project not found",
      status: 404,
    };
  }

  // Check if the organization is of type CONTRACTOR
  if (project.organization.type !== OrganizationType.CONTRACTOR) {
    return {
      allowed: false,
      error: "Only contractor organizations can have projects",
      status: 403,
    };
  }

  // Check organization membership
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId: project.organizationId,
    },
  });

  // Only admin role can delete projects
  if (membership && membership.role === MemberRole.ADMIN) {
    return {
      allowed: true,
      project,
      membership,
    };
  }

  // Otherwise, deny access
  return {
    allowed: false,
    error: "Only administrators can delete projects",
    status: 403,
  };
}

// Check if a user can create projects in an organization
export async function canCreateProjects(
  userId: string,
  organizationId: string
): Promise<boolean> {
  if (!userId || !organizationId) {
    return false;
  }

  // Get the organization
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  // Only CONTRACTOR orgs can have projects
  if (!organization || organization.type !== OrganizationType.CONTRACTOR) {
    return false;
  }

  // Check membership
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId,
      role: { in: [MemberRole.ADMIN, MemberRole.MEMBER] },
    },
  });

  return !!membership;
}
