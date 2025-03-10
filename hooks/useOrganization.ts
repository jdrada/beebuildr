import { useQuery } from "@tanstack/react-query";

export function useOrganization(organizationId?: string) {
  return useQuery({
    queryKey: ["organization", organizationId],
    queryFn: async () => {
      if (!organizationId) return null;

      const response = await fetch(`/api/organizations/${organizationId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch organization");
      }

      return response.json();
    },
    enabled: !!organizationId,
  });
}
