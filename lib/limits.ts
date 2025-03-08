import { prisma } from "@/lib/prisma";

// Default limits for free tier
export const FREE_TIER_LIMITS = {
  MAX_ORGANIZATIONS: 1,
};

// Default limits for paid tier (to be implemented later)
export const PAID_TIER_LIMITS = {
  MAX_ORGANIZATIONS: 10,
};

// Check if user has reached organization limit
export async function hasReachedOrganizationLimit(
  userId: string
): Promise<boolean> {
  if (!userId) return true; // Fail safely if no userId is provided

  try {
    // Get the count of organizations the user is an admin of
    const orgCount = await prisma.organizationMember.count({
      where: {
        userId,
        role: "ADMIN", // Only count orgs where they are admin (i.e., they created it)
      },
    });

    console.log(
      `User ${userId} has ${orgCount} organizations of ${FREE_TIER_LIMITS.MAX_ORGANIZATIONS} allowed`
    );
    return orgCount >= FREE_TIER_LIMITS.MAX_ORGANIZATIONS;
  } catch (error) {
    console.error("Error checking organization limit:", error);
    return false; // Allow creation if there's an error (fail open for new users)
  }
}

// In the future, this would check if the user has a paid subscription
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  // TODO: Implement subscription check when payment is added
  // For now, always return false (no paid subscription)
  return false;
}

// Get the organization limit for a user based on their subscription
export async function getUserOrganizationLimit(
  userId: string
): Promise<number> {
  if (!userId) return 0; // Fail safely if no userId is provided

  const hasPaidTier = await hasActiveSubscription(userId);
  return hasPaidTier
    ? PAID_TIER_LIMITS.MAX_ORGANIZATIONS
    : FREE_TIER_LIMITS.MAX_ORGANIZATIONS;
}

// Get the number of remaining organizations a user can create
export async function getRemainingOrganizationCount(
  userId: string
): Promise<number> {
  if (!userId) return 0; // Fail safely if no userId is provided

  try {
    // Get the count of organizations the user is an admin of
    const orgCount = await prisma.organizationMember.count({
      where: {
        userId,
        role: "ADMIN",
      },
    });

    const limit = await getUserOrganizationLimit(userId);
    const remaining = Math.max(0, limit - orgCount);
    console.log(
      `User ${userId} has ${remaining} organizations remaining (${orgCount}/${limit})`
    );
    return remaining;
  } catch (error) {
    console.error("Error getting remaining organization count:", error);
    // If there's an error counting, assume they can create one org (for new users)
    return 1;
  }
}
