"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import {
  FileSpreadsheet,
  Pencil,
  Trash2,
  Users,
  ArrowUpDown,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { Button } from "@/components/ui/button";
import { DataTable, DataTableRowActions } from "@/components/ui/data-table";

// Define your project type and status
export enum ProjectStatus {
  ACTIVE = "ACTIVE",
  PLANNING = "PLANNING",
  COMPLETED = "COMPLETED",
  ON_HOLD = "ON_HOLD",
  CANCELED = "CANCELED",
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  clientName?: string;
  projectType?: string;
  createdAt: string;
  viewers?: { id: string }[];
  budgetProjects?: { id: string }[];
}

// Status badges styling
const statusColors: Record<ProjectStatus, string> = {
  [ProjectStatus.ACTIVE]:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 font-medium text-xs",
  [ProjectStatus.PLANNING]:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 font-medium text-xs",
  [ProjectStatus.COMPLETED]:
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 font-medium text-xs",
  [ProjectStatus.ON_HOLD]:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 font-medium text-xs",
  [ProjectStatus.CANCELED]:
    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 font-medium text-xs",
};

export function ProjectsTable({ projects }: { projects: Project[] }) {
  // Configure initial sorting to show newest projects first
  const initialSorting = [{ id: "createdAt", desc: true }];

  const columns: ColumnDef<Project>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="h-4 w-4"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="h-4 w-4"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium group relative">
          <Link
            href={`/projects/${row.original.id}`}
            className="hover:underline flex items-center w-full group-hover:bg-gray-50 rounded px-1 py-0.5 transition-colors"
          >
            {row.getValue("name")}
            <div className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-0">
              <div className="flex items-center text-gray-500" title="Details">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-chevron-right"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-3 h-8 px-2 hover:bg-transparent hover:text-gray-900"
          >
            Status
            <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const status = row.getValue("status") as ProjectStatus;
        const statusText =
          status.charAt(0) + status.slice(1).toLowerCase().replace("_", " ");
        return <Badge className={statusColors[status]}>{statusText}</Badge>;
      },
      sortingFn: (rowA, rowB, columnId) => {
        const statusA = rowA.getValue(columnId) as ProjectStatus;
        const statusB = rowB.getValue(columnId) as ProjectStatus;

        // Custom sort order: ACTIVE, PLANNING, ON_HOLD, COMPLETED, CANCELED
        const statusOrder = {
          [ProjectStatus.ACTIVE]: 1,
          [ProjectStatus.PLANNING]: 2,
          [ProjectStatus.ON_HOLD]: 3,
          [ProjectStatus.COMPLETED]: 4,
          [ProjectStatus.CANCELED]: 5,
        };

        return statusOrder[statusA] - statusOrder[statusB];
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "clientName",
      header: "Client",
      cell: ({ row }) => (
        <span className="text-gray-700">
          {row.getValue("clientName") || "—"}
        </span>
      ),
    },
    {
      accessorKey: "projectType",
      header: "Type",
      cell: ({ row }) => (
        <span className="text-gray-700">
          {row.getValue("projectType") || "—"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-3 h-8 px-2 hover:bg-transparent hover:text-gray-900"
          >
            Created
            <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return (
          <span className="text-gray-700">{date.toLocaleDateString()}</span>
        );
      },
      sortingFn: "datetime",
    },
    {
      id: "metrics",
      header: "Metrics",
      cell: ({ row }) => {
        const project = row.original;
        return (
          <div className="flex gap-3 text-gray-500">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{project.viewers?.length || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{project.budgetProjects?.length || 0}</span>
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const project = row.original;
        return (
          <DataTableRowActions
            row={row}
            actions={[
              {
                label: "Edit",
                icon: <Pencil className="h-3.5 w-3.5" />,
                onClick: () => {
                  window.location.href = `/projects/${project.id}/edit`;
                },
              },
              {
                label: "Delete",
                icon: <Trash2 className="h-3.5 w-3.5" />,
                destructive: true,
                onClick: () => {
                  // Implement delete functionality
                  console.log(`Delete project: ${project.id}`);
                },
              },
            ]}
          />
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={projects}
      filterColumn="name"
      searchPlaceholder="Search projects..."
      initialSorting={initialSorting}
    />
  );
}
