"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useOrganization } from "@/contexts/organization-context";
import { MemberRole } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { UserSearch, UserSearchResult } from "@/components/user-search";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import React from "react";

export default function AddViewerPage({ params }: { params: { id: string } }) {
  // Unwrap params using React.use()
  const unwrappedParams = React.use(
    params as unknown as Promise<{ id: string }>
  );
  const projectId = unwrappedParams.id;

  const router = useRouter();
  const { activeOrganization, activeRole } = useOrganization();
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Only admins and members can add viewers
  const canEdit =
    activeRole && [MemberRole.ADMIN, MemberRole.MEMBER].includes(activeRole);

  useEffect(() => {
    const fetchProject = async () => {
      if (!activeOrganization?.id) return;

      try {
        setIsLoading(true);
        setError("");
        const response = await fetch(`/api/projects/${projectId}`);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch project");
        }

        if (!data.project) {
          throw new Error("Project not found");
        }

        setProject(data.project);
      } catch (error) {
        console.error("Error fetching project:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load project"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [activeOrganization?.id, projectId]);

  const handleAddViewer = async (user: UserSearchResult) => {
    try {
      setError("");
      setSuccess("");

      const response = await fetch(`/api/projects/${projectId}/viewers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add viewer");
      }

      setSuccess(`${user.displayName} has been added as a viewer`);

      // Redirect back to project page after a short delay
      setTimeout(() => {
        router.push(`/projects/${projectId}`);
      }, 1500);
    } catch (error) {
      console.error("Error adding viewer:", error);
      setError(error instanceof Error ? error.message : "Failed to add viewer");
    }
  };

  if (!canEdit) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">
          <p className="text-red-600">
            You don't have permission to add viewers to this project.
          </p>
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
            <h1 className="text-3xl font-bold">Add Viewer</h1>
            <p className="text-muted-foreground mt-1">
              {project
                ? `Add a viewer to ${project.name}`
                : "Loading project..."}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-600 rounded-md">
            {success}
          </div>
        )}

        <div className="border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Search for a User</h2>
          <p className="text-muted-foreground mb-4">
            Search for a user by name, email, or username to add them as a
            viewer to this project. Only users with the "Viewer" role in your
            organization can be added as project viewers.
          </p>

          <UserSearch
            onSelect={handleAddViewer}
            placeholder="Search by name, email, or username..."
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
