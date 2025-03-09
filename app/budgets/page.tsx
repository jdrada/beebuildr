"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useOrganization } from "@/contexts/organization-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { useBudgets, type Budget } from "@/hooks/useBudgets";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

export default function BudgetsPage() {
  const { activeOrganization } = useOrganization();
  const [activeTab, setActiveTab] = useState<"all" | "templates" | "specific">(
    "all"
  );

  const {
    data: budgets = [],
    isLoading,
    error,
  } = useBudgets(activeOrganization?.id);

  // Filter budgets based on active tab
  const filteredBudgets = (budgets as Budget[]).filter((budget: Budget) => {
    if (activeTab === "all") return true;
    if (activeTab === "templates") return budget.isTemplate;
    return !budget.isTemplate;
  });

  // Calculate total for each budget
  const calculateBudgetTotal = (budget: Budget): number => {
    return budget.budgetItems.reduce((total: number, item) => {
      return total + item.quantity * item.priceAtTime;
    }, 0);
  };

  if (!activeOrganization) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">
          <p>Please select an organization to view budgets.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Budgets</h1>
            <p className="text-muted-foreground mt-1">
              Manage your budgets and budget templates
            </p>
          </div>

          <Button asChild>
            <Link href="/budgets/new">
              <PlusCircle className="w-4 h-4 mr-2" />
              New Budget
            </Link>
          </Button>
        </div>

        {error instanceof Error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error.message}
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
        >
          <TabsList>
            <TabsTrigger value="all">All Budgets</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="specific">Project-Specific</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-[100px] w-full" />
                <Skeleton className="h-[100px] w-full" />
                <Skeleton className="h-[100px] w-full" />
              </div>
            ) : filteredBudgets.length === 0 ? (
              <div className="text-center p-12 border rounded-lg">
                <p className="text-muted-foreground">No budgets found.</p>
                <Button asChild className="mt-4">
                  <Link href="/budgets/new">Create Budget</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredBudgets.map((budget: Budget) => (
                  <Card key={budget.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{budget.title}</CardTitle>
                          {budget.description && (
                            <CardDescription>
                              {budget.description}
                            </CardDescription>
                          )}
                        </div>
                        <Button variant="outline" asChild>
                          <Link href={`/budgets/${budget.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            {budget.isTemplate
                              ? "Template Budget"
                              : "Project-Specific Budget"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {budget.budgetItems.length} items
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-lg font-semibold">
                            {formatCurrency(calculateBudgetTotal(budget))}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
