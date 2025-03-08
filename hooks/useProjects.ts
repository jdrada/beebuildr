import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProjectStatus, ProjectType } from "@prisma/client";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;

  // Client Information
  clientName: string | null;
  contactPerson: string | null;
  clientPhone: string | null;
  clientEmail: string | null;
  billingAddress: string | null;

  // Project Information
  projectAddress: string | null;
  projectType: ProjectType | null;
  projectScope: string | null;
  startDate: string | null;
  endDate: string | null;

  // Organization and user information
  organization: {
    id: string;
    name: string;
    type: string;
  };
  createdBy: {
    id: string;
    name: string | null;
    email: string | null;
    username: string | null;
    image: string | null;
  };
  viewers: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      username: string | null;
      image: string | null;
    };
  }[];
  budgets: {
    id: string;
    title: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
  }[];
  _count: {
    viewers: number;
    budgets: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Hook to fetch all projects for an organization
export function useProjects(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["projects", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const response = await fetch(
        `/api/projects?organizationId=${organizationId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch projects");
      }

      return data.projects || [];
    },
    enabled: !!organizationId,
  });
}

// Hook to fetch a single project by ID
export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch project");
      }

      return data.project;
    },
    enabled: !!projectId,
  });
}

// Hook to create a new project
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectData: {
      name: string;
      description?: string;
      status?: ProjectStatus;

      // Client Information
      clientName?: string;
      contactPerson?: string;
      clientPhone?: string;
      clientEmail?: string;
      billingAddress?: string;

      // Project Information
      projectAddress?: string;
      projectType?: ProjectType;
      projectScope?: string;
      startDate?: Date | null;
      endDate?: Date | null;

      organizationId: string;
    }) => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      return data.project;
    },
    onSuccess: (_, variables) => {
      // Invalidate projects query to refetch the list
      queryClient.invalidateQueries({
        queryKey: ["projects", variables.organizationId],
      });
    },
  });
}

// Hook to delete a project
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      organizationId,
    }: {
      projectId: string;
      organizationId: string;
    }) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete project");
      }

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate projects query to refetch the list
      queryClient.invalidateQueries({
        queryKey: ["projects", variables.organizationId],
      });
    },
  });
}

// Hook to add a viewer to a project
export function useAddViewer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      userId,
    }: {
      projectId: string;
      userId: string;
    }) => {
      const response = await fetch(`/api/projects/${projectId}/viewers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add viewer");
      }

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate project query to refetch the details
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
    },
  });
}

// Hook to remove a viewer from a project
export function useRemoveViewer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      viewerId,
    }: {
      projectId: string;
      viewerId: string;
    }) => {
      const response = await fetch(
        `/api/projects/${projectId}/viewers/${viewerId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove viewer");
      }

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate project query to refetch the details
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
    },
  });
}

// Add a hook to check project limits
export function useProjectLimit(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["project-limit", organizationId],
    queryFn: async () => {
      if (!organizationId)
        return { remaining: 0, limitReached: true, total: 0, limit: 0 };

      const response = await fetch(
        `/api/organizations/${organizationId}/project-limit`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to check project limit");
      }

      return data;
    },
    enabled: !!organizationId,
  });
}
