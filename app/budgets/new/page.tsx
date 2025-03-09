"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useOrganization } from "@/contexts/organization-context";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCreateBudget } from "@/hooks/useBudgets";

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  isTemplate: z.boolean().default(false),
});

export default function NewBudgetPage() {
  const router = useRouter();
  const { activeOrganization } = useOrganization();
  const [error, setError] = useState("");

  const createBudget = useCreateBudget();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      isTemplate: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!activeOrganization?.id) {
      setError("Please select an organization first");
      return;
    }

    try {
      setError("");

      const budget = await createBudget.mutateAsync({
        ...values,
        organizationId: activeOrganization.id,
      });

      // Redirect to the budget details page
      router.push(`/budgets/${budget.id}`);
    } catch (error) {
      console.error("Error creating budget:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create budget"
      );
    }
  };

  if (!activeOrganization) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">
          <p>Please select an organization to create a budget.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/budgets">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Budget</h1>
            <p className="text-muted-foreground mt-1">
              Create a new budget or budget template
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter budget title" {...field} />
                  </FormControl>
                  <FormDescription>
                    Give your budget a clear and descriptive title
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter budget description"
                      className="resize-none min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide additional details about this budget
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isTemplate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Template Budget</FormLabel>
                    <FormDescription>
                      Make this a reusable template that can be applied to
                      multiple projects
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button variant="outline" asChild>
                <Link href="/budgets">Cancel</Link>
              </Button>
              <Button type="submit" disabled={createBudget.isPending}>
                {createBudget.isPending ? "Creating..." : "Create Budget"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
