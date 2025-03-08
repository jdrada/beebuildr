import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import Link from "next/link";

export default function BudgetsPage() {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Budgets</h1>
        <Link
          href="/budgets/new"
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
        >
          Create Budget
        </Link>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted p-4 border-b">
          <div className="grid grid-cols-12 gap-4 font-medium">
            <div className="col-span-5">Title</div>
            <div className="col-span-3">Created</div>
            <div className="col-span-2">Items</div>
            <div className="col-span-2">Total</div>
          </div>
        </div>

        <div className="p-4 text-center text-muted-foreground">
          No budgets found. Create your first budget to get started.
        </div>
      </div>
    </DashboardLayout>
  );
}
