"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useOrganization } from "@/contexts/organization-context";
import { ProjectStatus, ProjectType } from "@prisma/client";
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
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useProject, useUpdateProject } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const formSchema = z.object({
  // Basic Project Info
  name: z.string().min(1, "Project name is required").max(255),
  description: z.string().optional().nullable(),
  status: z.enum([
    ProjectStatus.PLANNING,
    ProjectStatus.IN_PROGRESS,
    ProjectStatus.ON_HOLD,
    ProjectStatus.COMPLETED,
    ProjectStatus.CANCELLED,
  ]),

  // Client Information
  clientName: z.string().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  clientPhone: z.string().optional().nullable(),
  clientEmail: z.string().email("Invalid email address").optional().nullable(),
  billingAddress: z.string().optional().nullable(),

  // Project Details
  projectAddress: z.string().optional().nullable(),
  projectType: z
    .enum([
      ProjectType.RESIDENTIAL,
      ProjectType.COMMERCIAL,
      ProjectType.INDUSTRIAL,
      ProjectType.INSTITUTIONAL,
      ProjectType.INFRASTRUCTURE,
      ProjectType.RENOVATION,
      ProjectType.OTHER,
    ])
    .nullable(),
  projectScope: z.string().optional().nullable(),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
});

export default function EditProjectPage({
  params,
}: {
  params: { id: string };
}) {
  // Unwrap params using React.use()
  const unwrappedParams = React.use(
    params as unknown as Promise<{ id: string }>
  );
  const projectId = unwrappedParams.id;

  const router = useRouter();
  const { activeOrganization, activeRole } = useOrganization();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch project details
  const { data: project, isLoading, error: fetchError } = useProject(projectId);

  // Update project mutation
  const updateProject = useUpdateProject();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      status: ProjectStatus.PLANNING,
      clientName: "",
      contactPerson: "",
      clientPhone: "",
      clientEmail: "",
      billingAddress: "",
      projectAddress: "",
      projectType: null,
      projectScope: "",
      startDate: null,
      endDate: null,
    },
  });

  // Update form values when project data is loaded
  React.useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        description: project.description,
        status: project.status as ProjectStatus,
        clientName: project.clientName,
        contactPerson: project.contactPerson,
        clientPhone: project.clientPhone,
        clientEmail: project.clientEmail,
        billingAddress: project.billingAddress,
        projectAddress: project.projectAddress,
        projectType: project.projectType as ProjectType,
        projectScope: project.projectScope,
        startDate: project.startDate ? new Date(project.startDate) : null,
        endDate: project.endDate ? new Date(project.endDate) : null,
      });
    }
  }, [project, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!activeOrganization?.id) {
      setError("Please select an organization first");
      return;
    }

    try {
      setError("");
      setSuccess("");

      await updateProject.mutateAsync({
        projectId,
        data: {
          ...values,
          // Convert dates to ISO strings for API
          startDate: values.startDate ? values.startDate.toISOString() : null,
          endDate: values.endDate ? values.endDate.toISOString() : null,
        },
      });

      setSuccess("Project updated successfully");

      // Redirect back to project details after a short delay
      setTimeout(() => {
        router.push(`/projects/${projectId}`);
      }, 1500);
    } catch (error) {
      console.error("Error updating project:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update project"
      );
    }
  };

  if (!activeOrganization) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">
          <p>Please select an organization to edit this project.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Project</h1>
            <p className="text-muted-foreground mt-1">
              {isLoading
                ? "Loading project details..."
                : `Editing: ${project?.name}`}
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
              : "Failed to load project details"}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-1/2 mx-auto" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Information</TabsTrigger>
                  <TabsTrigger value="client">Client Information</TabsTrigger>
                  <TabsTrigger value="details">Project Details</TabsTrigger>
                </TabsList>

                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter project name" {...field} />
                        </FormControl>
                        <FormDescription>
                          Give your project a clear and descriptive name
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
                            placeholder="Enter project description"
                            className="resize-none min-h-[100px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a general overview of the project
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={ProjectStatus.PLANNING}>
                              Planning
                            </SelectItem>
                            <SelectItem value={ProjectStatus.IN_PROGRESS}>
                              In Progress
                            </SelectItem>
                            <SelectItem value={ProjectStatus.ON_HOLD}>
                              On Hold
                            </SelectItem>
                            <SelectItem value={ProjectStatus.COMPLETED}>
                              Completed
                            </SelectItem>
                            <SelectItem value={ProjectStatus.CANCELLED}>
                              Cancelled
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Current status of the project
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Client Information Tab */}
                <TabsContent value="client" className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Full name or company name"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the client&apos;s full name or company name
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contact person (if company)"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Primary contact person if the client is a company
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="clientPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Phone number"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="clientEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Email address"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="billingAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Billing address"
                            className="resize-none min-h-[80px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Project Details Tab */}
                <TabsContent value="details" className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="projectAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Location where construction will take place"
                            className="resize-none min-h-[80px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          The physical location where the construction will take
                          place
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={ProjectType.RESIDENTIAL}>
                              Residential
                            </SelectItem>
                            <SelectItem value={ProjectType.COMMERCIAL}>
                              Commercial
                            </SelectItem>
                            <SelectItem value={ProjectType.INDUSTRIAL}>
                              Industrial
                            </SelectItem>
                            <SelectItem value={ProjectType.INSTITUTIONAL}>
                              Institutional
                            </SelectItem>
                            <SelectItem value={ProjectType.INFRASTRUCTURE}>
                              Infrastructure
                            </SelectItem>
                            <SelectItem value={ProjectType.RENOVATION}>
                              Renovation
                            </SelectItem>
                            <SelectItem value={ProjectType.OTHER}>
                              Other
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Type of construction project
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectScope"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Scope</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description of what the project entails"
                            className="resize-none min-h-[100px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Detailed description of the work to be performed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Estimated project start date
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>End Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Estimated project completion date
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button variant="outline" asChild>
                  <Link href={`/projects/${projectId}`}>Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={updateProject.isPending || !form.formState.isDirty}
                >
                  {updateProject.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </DashboardLayout>
  );
}
