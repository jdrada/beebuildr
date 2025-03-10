import { useOrganization } from "@/contexts/organization-context";
import { MemberRole } from "@prisma/client";

export function useActiveOrganization() {
  const { activeOrganization, activeRole } = useOrganization();

  return {
    activeOrganization,
    activeRole: activeRole as MemberRole,
  };
}
