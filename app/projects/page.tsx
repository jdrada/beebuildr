"use client";

import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useOrganization } from "@/contexts/organization-context";
import { MemberRole } from "@/lib/auth-utils";
import { ProjectStatus } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PlusCircle,
  ClipboardList,
  Clock,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Users,
  FileSpreadsheet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useProjects, Project, useProjectLimit } from "@/hooks/useProjects";

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

export default function ProjectsPage() {
  const { activeOrganization, activeRole } = useOrganization();

  // Use React Query hook instead of useState and useEffect
  const {
    data: projects = [],
    isLoading,
    error,
  } = useProjects(activeOrganization?.id);

  const {
    data: projectLimit = {
      remaining: 0,
      limitReached: false,
      total: 0,
      limit: 0,
    },
    isLoading: isLoadingLimit,
  } = useProjectLimit(activeOrganization?.id);

  const canCreateProject =
    activeRole && [MemberRole.ADMIN, MemberRole.MEMBER].includes(activeRole);

  if (!activeOrganization) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">
          <p>Please select an organization to view projects.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground mt-1">
              Manage your construction and renovation projects
            </p>
          </div>

          <div className="flex items-center gap-4">
            {!isLoadingLimit && (
              <div className="text-sm text-muted-foreground">
                <span
                  className={
                    projectLimit.remaining === 0
                      ? "text-red-500 font-medium"
                      : ""
                  }
                >
                  {projectLimit.total} / {projectLimit.limit} projects
                </span>
              </div>
            )}

            {canCreateProject && (
              <Button asChild disabled={projectLimit.limitReached}>
                <Link
                  href={
                    projectLimit.limitReached
                      ? "/settings/billing"
                      : "/projects/new"
                  }
                >
                  {projectLimit.limitReached ? (
                    <>Upgrade to Add More</>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      New Project
                    </>
                  )}
                </Link>
              </Button>
            )}
          </div>
        </div>

        {projectLimit.limitReached && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md flex items-center justify-between">
            <div>
              <p className="font-medium">Project limit reached</p>
              <p className="text-sm">
                You've reached your limit of {projectLimit.limit} projects.
                Upgrade your plan to create more projects.
              </p>
            </div>
            <Button size="sm" asChild>
              <Link href="/settings/billing">Upgrade Plan</Link>
            </Button>
          </div>
        )}

        {error instanceof Error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error.message}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No projects found</CardTitle>
              <CardDescription>
                {canCreateProject
                  ? "Create your first project to get started"
                  : "You don't have access to any projects yet"}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: Project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="line-clamp-2">
                        {project.name}
                      </CardTitle>
                      <Badge
                        variant="secondary"
                        className={`flex items-center gap-1 ${
                          statusColors[project.status as ProjectStatus]
                        }`}
                      >
                        {statusIcons[project.status as ProjectStatus]}
                        {project.status}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {project.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {project.clientName && (
                        <div className="flex items-center text-sm">
                          <span className="font-medium mr-2">Client:</span>
                          <span className="text-muted-foreground">
                            {project.clientName}
                          </span>
                        </div>
                      )}
                      {project.projectType && (
                        <div className="flex items-center text-sm">
                          <span className="font-medium mr-2">Type:</span>
                          <span className="text-muted-foreground">
                            {project.projectType}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{project._count.viewers}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>{project._count.budgets}</span>
                          </div>
                        </div>
                        <div>
                          Updated{" "}
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
