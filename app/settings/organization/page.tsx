"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useOrganization as useOrgContext } from "@/contexts/organization-context";
import { MemberRole, OrganizationType } from "@prisma/client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { ArrowLeft, Building, Users } from "lucide-react";
import {
  useOrganization,
  useUpdateOrganization,
} from "@/hooks/useOrganizations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  type: z.enum([OrganizationType.CONTRACTOR, OrganizationType.STORE]),
});

export default function OrganizationSettingsPage() {
  const { activeOrganization, activeRole } = useOrgContext();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch organization details
  const {
    data: organization,
    isLoading,
    error: fetchError,
  } = useOrganization(activeOrganization?.id);

  // Update organization mutation
  const updateOrganization = useUpdateOrganization();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: organization?.name || "",
      type: organization?.type || OrganizationType.CONTRACTOR,
    },
    values: {
      name: organization?.name || "",
      type: organization?.type || OrganizationType.CONTRACTOR,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!activeOrganization?.id) {
      setError("No active organization selected");
      return;
    }

    try {
      setError("");
      setSuccess("");

      await updateOrganization.mutateAsync({
        organizationId: activeOrganization.id,
        name: values.name,
        type: values.type,
      });

      setSuccess("Organization updated successfully");
    } catch (error) {
      console.error("Error updating organization:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update organization"
      );
    }
  };

  // Only admins can edit organization settings
  const canEdit = activeRole === MemberRole.ADMIN;

  if (!activeOrganization) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">
          <p>Please select an organization to view settings.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Organization Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your organization details and preferences
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-600 rounded-md">
            {success}
          </div>
        )}

        {fetchError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {fetchError instanceof Error
              ? fetchError.message
              : "Failed to load organization details"}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>
                  Update your organization&apos;s basic information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-40" />
                  </div>
                ) : (
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-6"
                    >
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter organization name"
                                {...field}
                                disabled={!canEdit}
                              />
                            </FormControl>
                            <FormDescription>
                              The name of your organization as it will appear
                              throughout the app
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={!canEdit}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select organization type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={OrganizationType.CONTRACTOR}>
                                  <div className="flex items-center gap-2">
                                    <Building className="w-4 h-4" />
                                    <span>Contractor</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value={OrganizationType.STORE}>
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    <span>Store</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Contractors can create projects and budgets.
                              Stores can manage items.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {canEdit && (
                        <Button
                          type="submit"
                          disabled={
                            updateOrganization.isPending ||
                            !form.formState.isDirty
                          }
                        >
                          {updateOrganization.isPending
                            ? "Saving..."
                            : "Save Changes"}
                        </Button>
                      )}
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Organization Stats</CardTitle>
                <CardDescription>Overview of your organization</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">Members</p>
                      <p className="text-2xl font-bold">
                        {organization?._count?.members || 0}
                      </p>
                    </div>

                    {organization?.type === OrganizationType.CONTRACTOR && (
                      <>
                        <div>
                          <p className="text-sm font-medium">Projects</p>
                          <p className="text-2xl font-bold">
                            {organization?._count?.projects || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Budgets</p>
                          <p className="text-2xl font-bold">
                            {organization?._count?.budgets || 0}
                          </p>
                        </div>
                      </>
                    )}

                    {organization?.type === OrganizationType.STORE && (
                      <div>
                        <p className="text-sm font-medium">Items</p>
                        <p className="text-2xl font-bold">
                          {organization?._count?.items || 0}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-sm">
                        {organization?.createdAt
                          ? new Date(
                              organization.createdAt
                            ).toLocaleDateString()
                          : "Unknown"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
