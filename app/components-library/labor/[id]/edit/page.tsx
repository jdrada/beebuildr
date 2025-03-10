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

interface Labor {
  id: string;
  code: string | null;
  role: string;
  description: string | null;
  unit: string;
  unitPrice: number;
  isPublic: boolean;
}

export default function EditLaborPage({
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
  const [labor, setLabor] = useState<Labor | null>(null);

  useEffect(() => {
    const fetchLabor = async () => {
      try {
        const response = await fetch(`/api/labor/${resolvedParams.id}`);
        const data = await response.json();
        if (response.ok) {
          setLabor(data.labor);
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to fetch labor",
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch labor",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (activeOrganization?.id) {
      fetchLabor();
    }
  }, [activeOrganization?.id, resolvedParams.id, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labor) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/labor/${resolvedParams.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(labor),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Labor updated successfully",
        });
        router.push("/components-library");
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update labor",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update labor",
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

  if (!labor) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-10">
          <h1 className="text-2xl font-bold">Labor not found</h1>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Edit Labor</h1>
          <p className="text-muted-foreground">
            Update the labor information below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={labor.code || ""}
              onChange={(e) =>
                setLabor({ ...labor, code: e.target.value || null })
              }
              placeholder="Enter code"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={labor.role}
              onChange={(e) => setLabor({ ...labor, role: e.target.value })}
              placeholder="Enter role"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={labor.description || ""}
              onChange={(e) =>
                setLabor({ ...labor, description: e.target.value || null })
              }
              placeholder="Enter description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Input
              id="unit"
              value={labor.unit}
              onChange={(e) => setLabor({ ...labor, unit: e.target.value })}
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
              value={labor.unitPrice}
              onChange={(e) =>
                setLabor({
                  ...labor,
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
              checked={labor.isPublic}
              onCheckedChange={(checked) =>
                setLabor({ ...labor, isPublic: checked })
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
