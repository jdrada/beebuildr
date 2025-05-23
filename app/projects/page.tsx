"use client";

import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useOrganization } from "@/contexts/organization-context";
import { MemberRole } from "@/lib/auth-utils";
import { ProjectStatus as PrismaProjectStatus } from "@prisma/client";
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
  TableProperties,
  LayoutGrid,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useProjects, useProjectLimit } from "@/hooks/useProjects";
import {
  ProjectsTable,
  ProjectStatus,
} from "@/components/projects/projects-table";
import { useState } from "react";

const statusIcons = {
  [PrismaProjectStatus.PLANNING]: <ClipboardList className="w-4 h-4" />,
  [PrismaProjectStatus.IN_PROGRESS]: <Clock className="w-4 h-4" />,
  [PrismaProjectStatus.COMPLETED]: <CheckCircle2 className="w-4 h-4" />,
  [PrismaProjectStatus.ON_HOLD]: <PauseCircle className="w-4 h-4" />,
  [PrismaProjectStatus.CANCELLED]: <XCircle className="w-4 h-4" />,
};

const statusColors = {
  [PrismaProjectStatus.PLANNING]: "bg-blue-100 text-blue-800",
  [PrismaProjectStatus.IN_PROGRESS]: "bg-green-100 text-green-800",
  [PrismaProjectStatus.ON_HOLD]: "bg-yellow-100 text-yellow-800",
  [PrismaProjectStatus.COMPLETED]: "bg-purple-100 text-purple-800",
  [PrismaProjectStatus.CANCELLED]: "bg-red-100 text-red-800",
};

interface ProjectType {
  id: string;
  name: string;
  description: string | null;
  status: string;
  organizationId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  clientName?: string | null;
  projectType?: string | null;
  organization: {
    name: string;
    type: string;
  };
  createdBy: {
    name: string | null;
    username: string | null;
  };
  viewers: unknown[];
  budgetProjects: unknown[];
  _count?: {
    viewers: number;
    budgets: number;
  };
}

// Map Prisma ProjectStatus to our component ProjectStatus
const mapProjectStatus = (status: string): ProjectStatus => {
  switch (status) {
    case PrismaProjectStatus.PLANNING:
      return ProjectStatus.PLANNING;
    case PrismaProjectStatus.IN_PROGRESS:
      return ProjectStatus.ACTIVE; // Map IN_PROGRESS to ACTIVE
    case PrismaProjectStatus.COMPLETED:
      return ProjectStatus.COMPLETED;
    case PrismaProjectStatus.ON_HOLD:
      return ProjectStatus.ON_HOLD;
    case PrismaProjectStatus.CANCELLED:
      return ProjectStatus.CANCELED; // Note the spelling difference
    default:
      return ProjectStatus.ACTIVE;
  }
};

// Helper function to convert DB ProjectType to the format expected by ProjectsTable
const mapProjectData = (projects: ProjectType[]) => {
  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description || undefined,
    status: mapProjectStatus(project.status),
    clientName: project.clientName || undefined,
    projectType: project.projectType || undefined,
    createdAt: project.createdAt,
    viewers: project.viewers as { id: string }[],
    budgetProjects: project.budgetProjects as { id: string }[],
  }));
};

export default function ProjectsPage() {
  const { activeOrganization, activeRole } = useOrganization();
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

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

  // Check if the user can create projects
  const canCreateProject =
    activeRole === MemberRole.ADMIN || activeRole === MemberRole.MEMBER;

  if (!activeOrganization) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">
          <p>Please select an organization to view projects.</p>
        </div>
      </DashboardLayout>
    );
  }

  // Convert projects to the format expected by ProjectsTable
  const formattedProjects = mapProjectData(projects as ProjectType[]);

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4.5rem)] pb-0">
        <div className="flex justify-between items-center mb-4">
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

            <div className="flex bg-muted p-1 rounded-md">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 px-2"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-8 px-2"
              >
                <TableProperties className="h-4 w-4" />
              </Button>
            </div>

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
          <div className="p-4 mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md flex items-center justify-between">
            <div>
              <p className="font-medium">Project limit reached</p>
              <p className="text-sm">
                You&apos;ve reached your limit of {projectLimit.limit} projects.
                Upgrade your plan to create more projects.
              </p>
            </div>
            <Button size="sm" asChild>
              <Link href="/settings/billing">Upgrade Plan</Link>
            </Button>
          </div>
        )}

        {error && (
          <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error instanceof Error ? error.message : "Failed to load projects"}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center p-12 border rounded-lg">
            <p className="text-muted-foreground">No projects found.</p>
            {canCreateProject && !projectLimit.limitReached && (
              <Button asChild className="mt-4">
                <Link href="/projects/new">Create Project</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="flex-1">
            {viewMode === "table" ? (
              <div className="bg-white h-full flex flex-col">
                <ProjectsTable projects={formattedProjects} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full overflow-auto">
                {projects.map((project: ProjectType) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex justify-between items-start">
                          <span className="truncate">{project.name}</span>
                          <Badge
                            className={
                              statusColors[
                                project.status as PrismaProjectStatus
                              ]
                            }
                          >
                            <span className="flex items-center gap-1">
                              {
                                statusIcons[
                                  project.status as PrismaProjectStatus
                                ]
                              }
                              <span>
                                {project.status.charAt(0) +
                                  project.status
                                    .slice(1)
                                    .toLowerCase()
                                    .replace("_", " ")}
                              </span>
                            </span>
                          </Badge>
                        </CardTitle>
                        {project.description && (
                          <CardDescription className="line-clamp-2">
                            {project.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          <p className="truncate">
                            {project.clientName
                              ? `Client: ${project.clientName}`
                              : "No client specified"}
                          </p>
                          <p className="truncate">
                            {project.projectType
                              ? `Type: ${project.projectType}`
                              : "Type not specified"}
                          </p>
                        </div>
                        <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
                          <div className="flex gap-4">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{project.viewers?.length || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileSpreadsheet className="w-4 h-4" />
                              <span>{project.budgetProjects?.length || 0}</span>
                            </div>
                          </div>
                          <div>
                            Created:{" "}
                            {new Date(project.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
