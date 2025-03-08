import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OrganizationType } from "@prisma/client";

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
    projects: number;
    budgets: number;
    items: number;
  };
}

// Hook to fetch organization details
export function useOrganization(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["organization", organizationId],
    queryFn: async () => {
      if (!organizationId) return null;

      const response = await fetch(`/api/organizations/${organizationId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch organization");
      }

      return data.organization;
    },
    enabled: !!organizationId,
  });
}

// Hook to update organization details
export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      name,
      type,
    }: {
      organizationId: string;
      name: string;
      type: OrganizationType;
    }) => {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update organization");
      }

      return data.organization;
    },
    onSuccess: (_, variables) => {
      // Invalidate organization query to refetch the details
      queryClient.invalidateQueries({
        queryKey: ["organization", variables.organizationId],
      });

      // Also invalidate the active organization in the context
      queryClient.invalidateQueries({ queryKey: ["active-organization"] });
    },
  });
}
