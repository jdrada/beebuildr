import { prisma } from "@/lib/prisma";
import { OrganizationType } from "@prisma/client";

// Constants for organization limits
export const FREE_PROJECT_LIMIT = 10;

/**
 * Check if an organization has reached its project limit
 * @param organizationId The ID of the organization to check
 * @returns An object with the remaining projects count and whether the limit is reached
 */
export async function checkProjectLimit(organizationId: string): Promise<{
  remaining: number;
  limitReached: boolean;
  total: number;
  limit: number;
}> {
  try {
    // Get the organization to check its type
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error("Organization not found");
    }

    // Count the organization's projects
    const projectCount = await prisma.project.count({
      where: { organizationId },
    });

    // Determine the limit based on organization type
    let limit = FREE_PROJECT_LIMIT;

    // For paid organizations, we could set different limits
    if (organization.type === OrganizationType.STORE) {
      // Store organizations might have different limits
      limit = FREE_PROJECT_LIMIT;
    }

    // Calculate remaining projects
    const remaining = Math.max(0, limit - projectCount);

    return {
      remaining,
      limitReached: projectCount >= limit,
      total: projectCount,
      limit,
    };
  } catch (error) {
    console.error("Error checking project limit:", error);
    // Default to allowing project creation in case of errors
    return {
      remaining: 1,
      limitReached: false,
      total: 0,
      limit: FREE_PROJECT_LIMIT,
    };
  }
}
