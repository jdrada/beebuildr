import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

// Types for reusable components
export interface Material {
  id: string;
  code?: string | null;
  name: string;
  description?: string | null;
  unit: string;
  unitPrice: number;
  isPublic: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Labor {
  id: string;
  code?: string | null;
  role: string;
  description?: string | null;
  unit: string;
  unitPrice: number;
  isPublic: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Equipment {
  id: string;
  code?: string | null;
  name: string;
  description?: string | null;
  unit: string;
  unitPrice: number;
  isPublic: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

// Input types for creating components
export interface CreateMaterialInput {
  code?: string | null;
  name: string;
  description?: string | null;
  unit: string;
  unitPrice: number;
  isPublic?: boolean;
  organizationId: string;
}

export interface CreateLaborInput {
  code?: string | null;
  role: string;
  description?: string | null;
  unit: string;
  unitPrice: number;
  isPublic?: boolean;
  organizationId: string;
}

export interface CreateEquipmentInput {
  code?: string | null;
  name: string;
  description?: string | null;
  unit: string;
  unitPrice: number;
  isPublic?: boolean;
  organizationId: string;
}

// Hooks for materials
export function useMaterials(organizationId?: string) {
  return useQuery({
    queryKey: ["materials", organizationId],
    queryFn: async () => {
      if (!organizationId) return { materials: [] };

      const response = await fetch(
        `/api/materials?organizationId=${organizationId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch materials");
      }

      return response.json();
    },
    enabled: !!organizationId,
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMaterialInput) => {
      const response = await fetch("/api/materials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create material");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["materials", variables.organizationId],
      });
      toast.success("Material created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create material");
    },
  });
}

// Hooks for labor
export function useLabor(organizationId?: string) {
  return useQuery({
    queryKey: ["labor", organizationId],
    queryFn: async () => {
      if (!organizationId) return { labor: [] };

      const response = await fetch(
        `/api/labor?organizationId=${organizationId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch labor");
      }

      return response.json();
    },
    enabled: !!organizationId,
  });
}

export function useCreateLabor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLaborInput) => {
      const response = await fetch("/api/labor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create labor");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["labor", variables.organizationId],
      });
      toast.success("Labor created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create labor");
    },
  });
}

// Hooks for equipment
export function useEquipment(organizationId?: string) {
  return useQuery({
    queryKey: ["equipment", organizationId],
    queryFn: async () => {
      if (!organizationId) return { equipment: [] };

      const response = await fetch(
        `/api/equipment?organizationId=${organizationId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch equipment");
      }

      return response.json();
    },
    enabled: !!organizationId,
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEquipmentInput) => {
      const response = await fetch("/api/equipment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create equipment");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["equipment", variables.organizationId],
      });
      toast.success("Equipment created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create equipment");
    },
  });
}
