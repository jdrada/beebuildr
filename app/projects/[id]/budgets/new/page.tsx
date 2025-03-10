"use client";

import { useState, useEffect } from "react";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCreateBudget } from "@/hooks/useBudgets";
import { useProject } from "@/hooks/useProjects";
import React from "react";

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
});

export default function NewProjectBudgetPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { activeOrganization } = useOrganization();
  const [error, setError] = useState("");

  // Unwrap params using React.use()
  const unwrappedParams = React.use(
    params as unknown as Promise<{ id: string }>
  );
  const projectId = unwrappedParams.id;

  const { data: project } = useProject(projectId);
  const createBudget = useCreateBudget();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: project ? `Budget for ${project.name}` : "",
      description: "",
    },
  });

  // Update form values when project data is loaded
  useEffect(() => {
    if (project) {
      form.setValue("title", `Budget for ${project.name}`);
    }
  }, [project, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!activeOrganization?.id) {
      setError("Please select an organization first");
      return;
    }

    if (!project) {
      setError("Project not found");
      return;
    }

    try {
      setError("");

      // Create a new budget and associate it with the project
      await createBudget.mutateAsync({
        title: values.title,
        description: values.description,
        isTemplate: false, // This is a project-specific budget
        organizationId: activeOrganization.id,
        projectId: projectId,
      });

      // Redirect back to the project page
      router.push(`/projects/${projectId}`);
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
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Add Budget to Project</h1>
            <p className="text-muted-foreground mt-1">
              Create a budget for this project
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
                  <FormLabel>Budget Title</FormLabel>
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

            <div className="flex justify-end gap-4">
              <Button variant="outline" asChild>
                <Link href={`/projects/${projectId}`}>Cancel</Link>
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
