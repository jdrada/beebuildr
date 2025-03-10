"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
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
import { useCreateMaterial } from "@/hooks/useComponentsLibrary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast";
import { OrganizationType } from "@prisma/client";
import { EmptyState } from "@/components/empty-state";

// Validate material
const formSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z.coerce.number().nonnegative("Unit price must be non-negative"),
  isPublic: z.boolean().default(false),
});

export default function NewMaterialPage() {
  const router = useRouter();
  const { activeOrganization } = useActiveOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createMaterial = useCreateMaterial();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      unit: "",
      unitPrice: 0,
      isPublic: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!activeOrganization) return;

    setIsSubmitting(true);
    try {
      await createMaterial.mutateAsync({
        ...values,
        organizationId: activeOrganization.id,
      });
      router.push("/components-library?tab=materials");
    } catch (error) {
      console.error("Error creating material:", error);
      toast.error("Failed to create material");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeOrganization) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <EmptyState
          title="No Organization Selected"
          description="Please select an organization to create materials."
        />
      </div>
    );
  }

  if (activeOrganization.type !== OrganizationType.CONTRACTOR) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-10">
          <EmptyState
            title="Materials"
            description="This feature is only available for contractor organizations."
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/components-library?tab=materials">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Materials
            </Link>
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">New Material</h2>
          <p className="text-muted-foreground">
            Add a new material to your components library
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Material Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code</FormLabel>
                        <FormControl>
                          <Input placeholder="MAT-001" {...field} />
                        </FormControl>
                        <FormDescription>
                          Optional code for this material
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Concrete" {...field} />
                        </FormControl>
                        <FormDescription>Name of the material</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="High-strength concrete mix"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional description of the material
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Input placeholder="m³" {...field} />
                        </FormControl>
                        <FormDescription>
                          Unit of measurement (e.g., m³, kg, each)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Price per unit</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Make Public</FormLabel>
                        <FormDescription>
                          Public materials can be viewed by other organizations
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    asChild
                    type="button"
                    disabled={isSubmitting}
                  >
                    <Link href="/components-library?tab=materials">Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Material"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
