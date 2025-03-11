"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/spinner";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Material, Labor, Equipment } from "@/hooks/useComponentsLibrary";

// Define types for different component types with usage information
interface MaterialWithUsage extends Material {
  usageCount?: number;
  inUse?: boolean;
}

interface LaborWithUsage extends Labor {
  usageCount?: number;
  inUse?: boolean;
}

interface EquipmentWithUsage extends Equipment {
  usageCount?: number;
  inUse?: boolean;
}

// Define a union type for all component types
type ComponentItem = (
  | MaterialWithUsage
  | LaborWithUsage
  | EquipmentWithUsage
) & {
  type?: "material" | "labor" | "equipment";
};

interface ComponentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentType: "material" | "labor" | "equipment";
  component: ComponentItem;
}

export function ComponentEditModal({
  isOpen,
  onClose,
  componentType,
  component,
}: ComponentEditModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(component);
  const queryClient = useQueryClient();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    if (type === "number") {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData({
      ...formData,
      isPublic: checked,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/${componentType}s/${component.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update ${componentType}`);
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: [`${componentType}s`, formData.organizationId],
      });

      toast.success(
        `${
          componentType.charAt(0).toUpperCase() + componentType.slice(1)
        } updated successfully`
      );
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (componentType) {
      case "material":
        return "name" in formData ? formData.name : "";
      case "labor":
        return "role" in formData ? formData.role : "";
      case "equipment":
        return "name" in formData ? formData.name : "";
      default:
        return "Edit Component";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Edit {componentType}: {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Code field */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="code" className="text-right">
              Code
            </Label>
            <Input
              id="code"
              name="code"
              value={formData.code || ""}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>

          {/* Name/Role field */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor={componentType === "labor" ? "role" : "name"}
              className="text-right"
            >
              {componentType === "labor" ? "Role" : "Name"}
            </Label>
            <Input
              id={componentType === "labor" ? "role" : "name"}
              name={componentType === "labor" ? "role" : "name"}
              value={
                componentType === "labor" && "role" in formData
                  ? formData.role
                  : "name" in formData
                  ? formData.name
                  : ""
              }
              onChange={handleInputChange}
              className="col-span-3"
              required
            />
          </div>

          {/* Description field */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>

          {/* Unit field */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unit" className="text-right">
              Unit
            </Label>
            <Input
              id="unit"
              name="unit"
              value={formData.unit}
              onChange={handleInputChange}
              className="col-span-3"
              required
            />
          </div>

          {/* Unit Price field */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unitPrice" className="text-right">
              Unit Price
            </Label>
            <Input
              id="unitPrice"
              name="unitPrice"
              type="number"
              step="0.01"
              value={formData.unitPrice}
              onChange={handleInputChange}
              className="col-span-3"
              required
            />
          </div>

          {/* Public switch */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isPublic" className="text-right">
              Public
            </Label>
            <div className="col-span-3 flex items-center">
              <Switch
                id="isPublic"
                checked={formData.isPublic || false}
                onCheckedChange={handleSwitchChange}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
