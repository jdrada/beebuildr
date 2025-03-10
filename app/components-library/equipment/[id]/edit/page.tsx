"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/spinner";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { Switch } from "@/components/ui/switch";
import { use } from "react";

interface Equipment {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  unit: string;
  unitPrice: number;
  isPublic: boolean;
}

export default function EditEquipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { activeOrganization } = useActiveOrganization();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [equipment, setEquipment] = useState<Equipment | null>(null);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const response = await fetch(`/api/equipment/${resolvedParams.id}`);
        const data = await response.json();
        if (response.ok) {
          setEquipment(data.equipment);
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to fetch equipment",
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch equipment",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (activeOrganization?.id) {
      fetchEquipment();
    }
  }, [activeOrganization?.id, resolvedParams.id, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipment) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/equipment/${resolvedParams.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(equipment),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Equipment updated successfully",
        });
        router.push("/components-library");
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update equipment",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update equipment",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[400px] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      </DashboardLayout>
    );
  }

  if (!equipment) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-10">
          <h1 className="text-2xl font-bold">Equipment not found</h1>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Edit Equipment</h1>
          <p className="text-muted-foreground">
            Update the equipment information below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={equipment.code || ""}
              onChange={(e) =>
                setEquipment({ ...equipment, code: e.target.value || null })
              }
              placeholder="Enter code"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={equipment.name}
              onChange={(e) =>
                setEquipment({ ...equipment, name: e.target.value })
              }
              placeholder="Enter name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={equipment.description || ""}
              onChange={(e) =>
                setEquipment({
                  ...equipment,
                  description: e.target.value || null,
                })
              }
              placeholder="Enter description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Input
              id="unit"
              value={equipment.unit}
              onChange={(e) =>
                setEquipment({ ...equipment, unit: e.target.value })
              }
              placeholder="Enter unit"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unitPrice">Unit Price</Label>
            <Input
              id="unitPrice"
              type="number"
              step="0.01"
              value={equipment.unitPrice}
              onChange={(e) =>
                setEquipment({
                  ...equipment,
                  unitPrice: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="Enter unit price"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isPublic"
              checked={equipment.isPublic}
              onCheckedChange={(checked) =>
                setEquipment({ ...equipment, isPublic: checked })
              }
            />
            <Label htmlFor="isPublic">Public</Label>
          </div>

          <div className="flex space-x-4">
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/components-library")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
