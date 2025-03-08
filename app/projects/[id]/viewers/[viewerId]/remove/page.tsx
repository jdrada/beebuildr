"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useOrganization } from "@/contexts/organization-context";
import { MemberRole } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import React from "react";

interface ViewerInfo {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    username: string | null;
  };
}

export default function RemoveViewerPage({
  params,
}: {
  params: { id: string; viewerId: string };
}) {
  // Unwrap params using React.use()
  const unwrappedParams = React.use(
    params as unknown as Promise<{ id: string; viewerId: string }>
  );
  const projectId = unwrappedParams.id;
  const viewerId = unwrappedParams.viewerId;

  const router = useRouter();
  const { activeOrganization, activeRole } = useOrganization();
  const [project, setProject] = useState<{ name: string } | null>(null);
  const [viewer, setViewer] = useState<ViewerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Only admins and members can remove viewers
  const canEdit =
    activeRole && [MemberRole.ADMIN, MemberRole.MEMBER].includes(activeRole);

  useEffect(() => {
    const fetchData = async () => {
      if (!activeOrganization?.id) return;

      try {
        setIsLoading(true);
        setError("");

        // Fetch project details
        const projectResponse = await fetch(`/api/projects/${projectId}`);
        const projectData = await projectResponse.json();

        if (!projectResponse.ok) {
          throw new Error(projectData.error || "Failed to fetch project");
        }

        if (!projectData.project) {
          throw new Error("Project not found");
        }

        setProject(projectData.project);

        // Find the viewer in the project data
        const viewerInfo = projectData.project.viewers.find(
          (v: ViewerInfo) => v.id === viewerId
        );

        if (!viewerInfo) {
          throw new Error("Viewer not found");
        }

        setViewer(viewerInfo);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeOrganization?.id, projectId, viewerId]);

  const handleRemoveViewer = async () => {
    try {
      setIsRemoving(true);
      setError("");
      setSuccess("");

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

      setSuccess("Viewer has been removed successfully");

      // Redirect back to project page after a short delay
      setTimeout(() => {
        router.push(`/projects/${projectId}`);
      }, 1500);
    } catch (error) {
      console.error("Error removing viewer:", error);
      setError(
        error instanceof Error ? error.message : "Failed to remove viewer"
      );
      setIsRemoving(false);
    }
  };

  if (!canEdit) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">
          <p className="text-red-600">
            You don&apos;t have permission to remove viewers from this project.
          </p>
          <Button asChild className="mt-4">
            <Link href={`/projects/${projectId}`}>Back to Project</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">
          <p className="text-red-600">{error}</p>
          <Button asChild className="mt-4">
            <Link href={`/projects/${projectId}`}>Back to Project</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Remove Viewer</h1>
            <p className="text-muted-foreground mt-1">
              {project
                ? `Remove viewer from ${project.name}`
                : "Loading project..."}
            </p>
          </div>
        </div>

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-600 rounded-md">
            {success}
          </div>
        )}

        <div className="border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Confirm Removal</h2>

          {viewer && (
            <div className="mb-6">
              <p className="mb-4">
                Are you sure you want to remove the following viewer from this
                project?
              </p>
              <div className="p-4 bg-muted rounded-md">
                <p className="font-medium">
                  {viewer.user.name || viewer.user.username || "Unknown User"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {viewer.user.email}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href={`/projects/${projectId}`}>Cancel</Link>
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveViewer}
              disabled={isRemoving}
            >
              {isRemoving ? "Removing..." : "Remove Viewer"}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
