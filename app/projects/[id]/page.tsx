"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useOrganization } from "@/contexts/organization-context";
import { MemberRole } from "@/lib/auth-utils";
import { ProjectStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  MoreVertical,
  Users,
  FileSpreadsheet,
  Trash2,
  UserPlus,
  ClipboardList,
  Clock,
  CheckCircle2,
  PauseCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { useProject, useDeleteProject } from "@/hooks/useProjects";

const statusIcons = {
  [ProjectStatus.PLANNING]: <ClipboardList className="w-4 h-4" />,
  [ProjectStatus.IN_PROGRESS]: <Clock className="w-4 h-4" />,
  [ProjectStatus.COMPLETED]: <CheckCircle2 className="w-4 h-4" />,
  [ProjectStatus.ON_HOLD]: <PauseCircle className="w-4 h-4" />,
  [ProjectStatus.CANCELLED]: <XCircle className="w-4 h-4" />,
};

const statusColors = {
  [ProjectStatus.PLANNING]: "bg-blue-100 text-blue-800",
  [ProjectStatus.IN_PROGRESS]: "bg-yellow-100 text-yellow-800",
  [ProjectStatus.COMPLETED]: "bg-green-100 text-green-800",
  [ProjectStatus.ON_HOLD]: "bg-orange-100 text-orange-800",
  [ProjectStatus.CANCELLED]: "bg-red-100 text-red-800",
};

export default function ProjectPage({ params }: { params: { id: string } }) {
  // Unwrap params using React.use()
  const unwrappedParams = React.use(
    params as unknown as Promise<{ id: string }>
  );
  const projectId = unwrappedParams.id;

  const router = useRouter();
  const { activeOrganization, activeRole } = useOrganization();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Use React Query hooks
  const { data: project, isLoading, error } = useProject(projectId);

  const deleteProject = useDeleteProject();

  const canEdit =
    activeRole && [MemberRole.ADMIN, MemberRole.MEMBER].includes(activeRole);
  const canDelete = activeRole === MemberRole.ADMIN;

  const handleDelete = async () => {
    if (!activeOrganization?.id) return;

    deleteProject.mutate(
      {
        projectId,
        organizationId: activeOrganization.id,
      },
      {
        onSuccess: () => {
          router.push("/projects");
        },
        onError: (error) => {
          console.error("Error deleting project:", error);
        },
      }
    );
  };

  if (!activeOrganization) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">
          <p>Please select an organization to view this project.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-40 bg-muted rounded"></div>
            <div className="h-40 bg-muted rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">
          <p className="text-red-600">
            {error instanceof Error ? error.message : "Project not found"}
          </p>
          <Button asChild className="mt-4">
            <Link href="/projects">Back to Projects</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/projects">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <p className="text-muted-foreground mt-1">
                Created by{" "}
                {project.createdBy.name ||
                  project.createdBy.username ||
                  project.createdBy.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge
              variant="secondary"
              className={`flex items-center gap-1 ${
                statusColors[project.status as ProjectStatus]
              }`}
            >
              {statusIcons[project.status as ProjectStatus]}
              {project.status}
            </Badge>

            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/projects/${project.id}/edit`}>
                      Edit Project
                    </Link>
                  </DropdownMenuItem>
                  {canDelete && (
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      Delete Project
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Description</h3>
                <p className="text-muted-foreground mt-1">
                  {project.description || "No description provided"}
                </p>
              </div>
              <div>
                <h3 className="font-medium">Organization</h3>
                <p className="text-muted-foreground mt-1">
                  {project.organization.name}
                </p>
              </div>
              <div className="flex gap-6">
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Viewers
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    {project._count.viewers}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Budgets
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    {project._count.budgets}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Client Name</h3>
                <p className="text-muted-foreground mt-1">
                  {project.clientName || "Not specified"}
                </p>
              </div>
              {project.contactPerson && (
                <div>
                  <h3 className="font-medium">Contact Person</h3>
                  <p className="text-muted-foreground mt-1">
                    {project.contactPerson}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Phone</h3>
                  <p className="text-muted-foreground mt-1">
                    {project.clientPhone || "Not specified"}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Email</h3>
                  <p className="text-muted-foreground mt-1">
                    {project.clientEmail || "Not specified"}
                  </p>
                </div>
              </div>
              {project.billingAddress && (
                <div>
                  <h3 className="font-medium">Billing Address</h3>
                  <p className="text-muted-foreground mt-1 whitespace-pre-line">
                    {project.billingAddress}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.projectAddress && (
                <div>
                  <h3 className="font-medium">Project Address</h3>
                  <p className="text-muted-foreground mt-1 whitespace-pre-line">
                    {project.projectAddress}
                  </p>
                </div>
              )}
              <div>
                <h3 className="font-medium">Project Type</h3>
                <p className="text-muted-foreground mt-1">
                  {project.projectType || "Not specified"}
                </p>
              </div>
              {project.projectScope && (
                <div>
                  <h3 className="font-medium">Project Scope</h3>
                  <p className="text-muted-foreground mt-1 whitespace-pre-line">
                    {project.projectScope}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Start Date</h3>
                  <p className="text-muted-foreground mt-1">
                    {project.startDate
                      ? new Date(project.startDate).toLocaleDateString()
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">End Date</h3>
                  <p className="text-muted-foreground mt-1">
                    {project.endDate
                      ? new Date(project.endDate).toLocaleDateString()
                      : "Not specified"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Project Viewers</CardTitle>
                <CardDescription>
                  Manage who can view this project
                </CardDescription>
              </div>
              {canEdit && (
                <Button size="sm" asChild>
                  <Link href={`/projects/${project.id}/viewers/add`}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Viewer
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {project.viewers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No viewers added yet
                </p>
              ) : (
                <div className="space-y-4">
                  {project.viewers.map((viewer) => (
                    <div
                      key={viewer.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={viewer.user.image || undefined} />
                          <AvatarFallback>
                            {(
                              viewer.user.name?.[0] ||
                              viewer.user.username?.[0] ||
                              "?"
                            ).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {viewer.user.name || viewer.user.username}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {viewer.user.email}
                          </p>
                        </div>
                      </div>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          asChild
                        >
                          <Link
                            href={`/projects/${project.id}/viewers/${viewer.id}/remove`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {project.budgets.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Project Budgets</CardTitle>
                <CardDescription>
                  Manage budgets associated with this project
                </CardDescription>
              </div>
              {canEdit && (
                <Button size="sm" asChild>
                  <Link href={`/budgets/new?projectId=${project.id}`}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    New Budget
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.budgets.map((budget) => (
                  <div
                    key={budget.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div>
                      <h3 className="font-medium">{budget.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {budget.description || "No description"}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/budgets/${budget.id}`}>View Budget</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Project</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this project? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteProject.isPending}
              >
                {deleteProject.isPending ? "Deleting..." : "Delete Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
