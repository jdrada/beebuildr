import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import Link from "next/link";

export default function ItemsPage() {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Items</h1>
        <Link
          href="/items/new"
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
        >
          Add Item
        </Link>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted p-4 border-b">
          <div className="grid grid-cols-12 gap-4 font-medium">
            <div className="col-span-4">Name</div>
            <div className="col-span-3">Description</div>
            <div className="col-span-2">Unit</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-1">Actions</div>
          </div>
        </div>

        <div className="p-4 text-center text-muted-foreground">
          No items found. Add your first item to get started.
        </div>
      </div>
    </DashboardLayout>
  );
}
