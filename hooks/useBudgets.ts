import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Budget {
  id: string;
  title: string;
  description: string | null;
  isTemplate: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  budgetItems: BudgetItem[];
  budgetProjects: BudgetProject[];
}

export interface BudgetItem {
  id: string;
  budgetId: string;
  itemId: string;
  quantity: number;
  priceAtTime: number;
  item: Item;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetProject {
  id: string;
  budgetId: string;
  projectId: string;
  createdAt: string;
}

// Hook to fetch all budgets for an organization
export function useBudgets(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["budgets", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const response = await fetch(
        `/api/organizations/${organizationId}/budgets`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch budgets");
      }

      return data.budgets;
    },
    enabled: !!organizationId,
  });
}

// Hook to fetch a single budget
export function useBudget(budgetId: string | undefined) {
  return useQuery({
    queryKey: ["budget", budgetId],
    queryFn: async () => {
      if (!budgetId) return null;

      const response = await fetch(`/api/budgets/${budgetId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch budget");
      }

      return data.budget;
    },
    enabled: !!budgetId,
  });
}

// Hook to fetch budgets for a project
export function useProjectBudgets(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-budgets", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const response = await fetch(`/api/projects/${projectId}/budgets`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch project budgets");
      }

      return data.budgets;
    },
    enabled: !!projectId,
  });
}

// Hook to apply a budget to a project
export function useApplyBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      budgetId,
      projectId,
      createCopy = false,
    }: {
      budgetId: string;
      projectId: string;
      createCopy?: boolean;
    }) => {
      const response = await fetch(`/api/budgets/${budgetId}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          createCopy,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to apply budget to project");
      }

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ["project-budgets", variables.projectId],
      });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({
        queryKey: ["budget", variables.budgetId],
      });
    },
  });
}

// Hook to create a new budget
export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      isTemplate,
      organizationId,
      projectId,
    }: {
      title: string;
      description?: string;
      isTemplate: boolean;
      organizationId: string;
      projectId?: string;
    }) => {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          isTemplate,
          organizationId,
          projectId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create budget");
      }

      return data.budget;
    },
    onSuccess: (_, variables) => {
      // Invalidate budgets query
      queryClient.invalidateQueries({
        queryKey: ["budgets", variables.organizationId],
      });
      if (variables.projectId) {
        queryClient.invalidateQueries({
          queryKey: ["project-budgets", variables.projectId],
        });
      }
    },
  });
}

// Hook to update a budget
export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      budgetId,
      data,
    }: {
      budgetId: string;
      data: {
        title?: string;
        description?: string | null;
        isTemplate?: boolean;
      };
    }) => {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to update budget");
      }

      return responseData.budget;
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ["budget", variables.budgetId],
      });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

// Hook to delete a budget
export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (budgetId: string) => {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete budget");
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate budgets query
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}
