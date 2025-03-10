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

interface Material {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  unit: string;
  unitPrice: number;
  isPublic: boolean;
}

export default function EditMaterialPage({
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
  const [material, setMaterial] = useState<Material | null>(null);

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const response = await fetch(`/api/materials/${resolvedParams.id}`);
        const data = await response.json();
        if (response.ok) {
          setMaterial(data.material);
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to fetch material",
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch material",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (activeOrganization?.id) {
      fetchMaterial();
    }
  }, [activeOrganization?.id, resolvedParams.id, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!material) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/materials/${resolvedParams.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(material),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Material updated successfully",
        });
        router.push("/components-library");
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update material",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update material",
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
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!material) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-10">
          <h1 className="text-2xl font-bold">Material not found</h1>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Edit Material</h1>
          <p className="text-muted-foreground">
            Update the material information below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={material.code || ""}
              onChange={(e) =>
                setMaterial({ ...material, code: e.target.value || null })
              }
              placeholder="Enter code"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={material.name}
              onChange={(e) =>
                setMaterial({ ...material, name: e.target.value })
              }
              placeholder="Enter name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={material.description || ""}
              onChange={(e) =>
                setMaterial({
                  ...material,
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
              value={material.unit}
              onChange={(e) =>
                setMaterial({ ...material, unit: e.target.value })
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
              value={material.unitPrice}
              onChange={(e) =>
                setMaterial({
                  ...material,
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
              checked={material.isPublic}
              onCheckedChange={(checked) =>
                setMaterial({ ...material, isPublic: checked })
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
