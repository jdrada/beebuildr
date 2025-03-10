import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types for UPA and its components
export interface UPAMaterial {
  id?: string;
  code?: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface UPALabor {
  id?: string;
  code?: string;
  role: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface UPAEquipment {
  id?: string;
  code?: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface UnitPriceAnalysis {
  id: string;
  title: string;
  description?: string | null;
  code?: string | null;
  unit: string;
  totalPrice: number;
  isPublic: boolean;
  hasAnnualMaintenance: boolean;
  maintenanceYears: number | null;
  annualMaintenanceRate: number | null;
  organizationId: string;
  materials: UPAMaterial[];
  labor: UPALabor[];
  equipment: UPAEquipment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateUPAInput {
  title: string;
  description?: string;
  code?: string;
  unit: string;
  hasAnnualMaintenance: boolean;
  maintenanceYears?: number | null;
  annualMaintenanceRate?: number | null;
  totalPrice: number;
  materials: UPAMaterial[];
  labor: UPALabor[];
  equipment: UPAEquipment[];
  organizationId: string;
}

// Hook to fetch all UPAs for an organization
export function useUnitPriceAnalyses(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["unit-price-analyses", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const response = await fetch(
        `/api/organizations/${organizationId}/unit-price-analyses`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch unit price analyses");
      }

      const data = await response.json();
      return data.unitPriceAnalyses;
    },
    enabled: !!organizationId,
  });
}

// Hook to fetch a single UPA
export function useUnitPriceAnalysis(upaId: string | undefined) {
  return useQuery({
    queryKey: ["unit-price-analysis", upaId],
    queryFn: async () => {
      if (!upaId) return null;

      const response = await fetch(`/api/unit-price-analyses/${upaId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch unit price analysis");
      }

      return data.unitPriceAnalysis;
    },
    enabled: !!upaId,
  });
}

// Hook for creating a new UPA
export function useCreateUnitPriceAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUPAInput) => {
      const response = await fetch("/api/unit-price-analyses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create unit price analysis");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unit-price-analyses"] });
    },
  });
}

// Hook to update a UPA
export function useUpdateUnitPriceAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      upaId,
      data,
    }: {
      upaId: string;
      data: {
        title?: string;
        description?: string | null;
        code?: string | null;
        unit?: string;
        materials?: UPAMaterial[];
        labor?: UPALabor[];
        equipment?: UPAEquipment[];
      };
    }) => {
      const response = await fetch(`/api/unit-price-analyses/${upaId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.error || "Failed to update unit price analysis"
        );
      }

      return responseData.unitPriceAnalysis;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ["unit-price-analysis", data.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["unit-price-analyses", data.organizationId],
      });
    },
  });
}

// Hook to delete a UPA
export function useDeleteUnitPriceAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      upaId,
      organizationId,
    }: {
      upaId: string;
      organizationId: string;
    }) => {
      const response = await fetch(`/api/unit-price-analyses/${upaId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete unit price analysis");
      }

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate UPAs query
      queryClient.invalidateQueries({
        queryKey: ["unit-price-analyses", variables.organizationId],
      });
    },
  });
}
