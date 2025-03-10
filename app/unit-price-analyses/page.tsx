"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { PlusCircle, Search, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Spinner } from "@/components/spinner";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useUnitPriceAnalyses } from "@/hooks/useUnitPriceAnalysis";
import { MemberRole } from "@prisma/client";
import { UnitPriceAnalysis } from "@/types";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

// Add delete handler
const handleDelete = async (id: string) => {
  try {
    const response = await fetch(`/api/unit-price-analyses/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete unit price analysis");
    }

    toast.success("Unit price analysis deleted successfully!");
  } catch (error) {
    console.error(error);
    toast.error("Failed to delete unit price analysis");
  }
};

// Update the table component
interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
}

function DataTable<TData>({ columns, data }: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Update the main component
export default function UnitPriceAnalysesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { activeOrganization, activeRole } = useActiveOrganization();
  const { data: upas, isLoading: upasLoading } = useUnitPriceAnalyses(
    activeOrganization?.id
  );

  const canCreateUPA =
    activeRole === MemberRole.ADMIN || activeRole === MemberRole.MEMBER;

  const columns: ColumnDef<UnitPriceAnalysis>[] = [
    {
      accessorKey: "title",
      header: "Title",
    },
    {
      accessorKey: "code",
      header: "Code",
    },
    {
      accessorKey: "unit",
      header: "Unit",
    },
    {
      accessorKey: "totalPrice",
      header: "Total Price",
      cell: ({ row }) => formatCurrency(row.getValue("totalPrice")),
    },
    {
      accessorKey: "hasAnnualMaintenance",
      header: "Has Maintenance",
      cell: ({ row }) => (row.getValue("hasAnnualMaintenance") ? "Yes" : "No"),
    },
    {
      accessorKey: "maintenanceYears",
      header: "Maintenance Years",
      cell: ({ row }) => row.getValue("maintenanceYears") || "-",
    },
    {
      accessorKey: "annualMaintenanceRate",
      header: "Maintenance Rate",
      cell: ({ row }) => {
        const rate = row.getValue("annualMaintenanceRate");
        return rate ? `${rate}%` : "-";
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const upa = row.original as UnitPriceAnalysis;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/unit-price-analyses/${upa.id}`)}
              >
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/unit-price-analyses/${upa.id}/edit`)
                }
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDelete(upa.id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const filteredUPAs = upas?.filter((upa: UnitPriceAnalysis) =>
    upa.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!activeOrganization) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <EmptyState
          title="No Organization Selected"
          description="Please select an organization to view unit price analyses."
        />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Unit Price Analyses
            </h2>
            <p className="text-muted-foreground">
              Manage your unit price analyses here
            </p>
          </div>
          {canCreateUPA && (
            <Button asChild>
              <Link href="/unit-price-analyses/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Analysis
              </Link>
            </Button>
          )}
        </div>

        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search analyses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
            type="search"
          />
        </div>

        {upasLoading ? (
          <div className="flex h-[400px] items-center justify-center">
            <Spinner />
          </div>
        ) : filteredUPAs?.length === 0 ? (
          <EmptyState
            title="No Unit Price Analyses"
            description="Create your first unit price analysis to get started."
            action={
              canCreateUPA && (
                <Button asChild>
                  <Link href="/unit-price-analyses/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Analysis
                  </Link>
                </Button>
              )
            }
          />
        ) : (
          <DataTable columns={columns} data={filteredUPAs || []} />
        )}
      </div>
    </DashboardLayout>
  );
}
