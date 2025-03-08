import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MemberRole } from "@/lib/auth-utils";

export interface Member {
  id: string;
  role: MemberRole;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    username: string | null;
    image: string | null;
  };
}

export interface UserSearchResult {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  image: string | null;
  displayName: string;
}

// Hook to fetch organization members
export function useOrganizationMembers(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["organization-members", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const response = await fetch(
        `/api/organizations/${organizationId}/members`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch organization members");
      }

      // Add showRoleDropdown property to each member
      return data.members.map((member: Member) => ({
        ...member,
        showRoleDropdown: false,
      }));
    },
    enabled: !!organizationId,
  });
}

// Hook to invite a user to an organization
export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      userId,
      role,
    }: {
      organizationId: string;
      userId: string;
      role: MemberRole;
    }) => {
      const response = await fetch(
        `/api/organizations/${organizationId}/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to invite user");
      }

      return data.membership;
    },
    onSuccess: (_, variables) => {
      // Invalidate organization members query to refetch the list
      queryClient.invalidateQueries({
        queryKey: ["organization-members", variables.organizationId],
      });
    },
  });
}

// Hook to remove a member from an organization
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      memberId,
    }: {
      organizationId: string;
      memberId: string;
    }) => {
      const response = await fetch(
        `/api/organizations/${organizationId}/members/${memberId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove member");
      }

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate organization members query to refetch the list
      queryClient.invalidateQueries({
        queryKey: ["organization-members", variables.organizationId],
      });
    },
  });
}

// Hook to update a member's role
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      memberId,
      role,
    }: {
      organizationId: string;
      memberId: string;
      role: MemberRole;
    }) => {
      const response = await fetch(
        `/api/organizations/${organizationId}/members/${memberId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update member role");
      }

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate organization members query to refetch the list
      queryClient.invalidateQueries({
        queryKey: ["organization-members", variables.organizationId],
      });
    },
  });
}
