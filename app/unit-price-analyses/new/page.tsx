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
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Search } from "lucide-react";
import { useCreateUnitPriceAnalysis } from "@/hooks/useUnitPriceAnalysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast";
import {
  useMaterials,
  useLabor,
  useEquipment,
  Material,
  Labor,
  Equipment,
  useCreateMaterial,
  useCreateLabor,
  useCreateEquipment,
  CreateMaterialInput,
  CreateLaborInput,
  CreateEquipmentInput,
} from "@/hooks/useComponentsLibrary";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";

// Validate UPA material
const materialSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z.coerce.number().nonnegative("Unit price must be non-negative"),
  materialId: z.string().optional(),
});

// Validate UPA labor
const laborSchema = z.object({
  code: z.string().optional(),
  role: z.string().min(1, "Role is required"),
  description: z.string().optional(),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z.coerce.number().nonnegative("Unit price must be non-negative"),
  laborId: z.string().optional(),
});

// Validate UPA equipment
const equipmentSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z.coerce.number().nonnegative("Unit price must be non-negative"),
  equipmentId: z.string().optional(),
});

// Form schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  code: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  hasAnnualMaintenance: z.boolean().default(false),
  maintenanceYears: z.coerce.number().int().positive().optional().nullable(),
  annualMaintenanceRate: z.coerce
    .number()
    .min(0)
    .max(100)
    .optional()
    .nullable(),
  materials: z.array(materialSchema),
  labor: z.array(laborSchema),
  equipment: z.array(equipmentSchema),
});

export default function NewUnitPriceAnalysisPage() {
  const router = useRouter();
  const { activeOrganization } = useOrganization();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMaterialsDialog, setShowMaterialsDialog] = useState(false);
  const [showLaborDialog, setShowLaborDialog] = useState(false);
  const [showEquipmentDialog, setShowEquipmentDialog] = useState(false);

  // New state for add component dialogs
  const [showAddMaterialDialog, setShowAddMaterialDialog] = useState(false);
  const [showAddLaborDialog, setShowAddLaborDialog] = useState(false);
  const [showAddEquipmentDialog, setShowAddEquipmentDialog] = useState(false);

  // Fetch components library data
  const { data: materialsData } = useMaterials(activeOrganization?.id);
  const { data: laborData } = useLabor(activeOrganization?.id);
  const { data: equipmentData } = useEquipment(activeOrganization?.id);

  // Mutations for creating components
  const createMaterial = useCreateMaterial();
  const createLabor = useCreateLabor();
  const createEquipment = useCreateEquipment();
  const queryClient = useQueryClient();

  // Filter components based on search query
  const filteredMaterials = materialsData?.materials?.filter(
    (material: Material) =>
      material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (material.code?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const filteredLabor = laborData?.labor?.filter(
    (labor: Labor) =>
      labor.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (labor.code?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const filteredEquipment = equipmentData?.equipment?.filter(
    (equipment: Equipment) =>
      equipment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (equipment.code?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const createUPA = useCreateUnitPriceAnalysis();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      code: "",
      unit: "",
      hasAnnualMaintenance: false,
      maintenanceYears: null,
      annualMaintenanceRate: null,
      materials: [],
      labor: [],
      equipment: [],
    },
  });

  // Field arrays for materials, labor, and equipment
  const {
    fields: materialFields,
    append: appendMaterial,
    remove: removeMaterial,
  } = useFieldArray({ control: form.control, name: "materials" });

  const {
    fields: laborFields,
    append: appendLabor,
    remove: removeLabor,
  } = useFieldArray({ control: form.control, name: "labor" });

  const {
    fields: equipmentFields,
    append: appendEquipment,
    remove: removeEquipment,
  } = useFieldArray({ control: form.control, name: "equipment" });

  // Calculate totals
  const calculateMaterialTotal = (index: number) => {
    const quantity = form.watch(`materials.${index}.quantity`) || 0;
    const unitPrice = form.watch(`materials.${index}.unitPrice`) || 0;
    return quantity * unitPrice;
  };

  const calculateLaborTotal = (index: number) => {
    const quantity = form.watch(`labor.${index}.quantity`) || 0;
    const unitPrice = form.watch(`labor.${index}.unitPrice`) || 0;
    return quantity * unitPrice;
  };

  const calculateEquipmentTotal = (index: number) => {
    const quantity = form.watch(`equipment.${index}.quantity`) || 0;
    const unitPrice = form.watch(`equipment.${index}.unitPrice`) || 0;
    return quantity * unitPrice;
  };

  // Calculate grand total
  const calculateGrandTotal = () => {
    let total = 0;

    // Add material totals
    materialFields.forEach((_, index) => {
      total += calculateMaterialTotal(index);
    });

    // Add labor totals
    laborFields.forEach((_, index) => {
      total += calculateLaborTotal(index);
    });

    // Add equipment totals
    equipmentFields.forEach((_, index) => {
      total += calculateEquipmentTotal(index);
    });

    return total;
  };

  // Add material from library
  const addMaterialFromLibrary = (material: Material) => {
    appendMaterial({
      code: material.code || "",
      name: material.name,
      description: material.description || "",
      quantity: 1,
      unit: material.unit,
      unitPrice: Number(material.unitPrice),
      materialId: material.id,
    });
    setShowMaterialsDialog(false);
    setSearchQuery("");
  };

  // Add labor from library
  const addLaborFromLibrary = (labor: Labor) => {
    appendLabor({
      code: labor.code || "",
      role: labor.role,
      description: labor.description || "",
      quantity: 1,
      unit: labor.unit,
      unitPrice: Number(labor.unitPrice),
      laborId: labor.id,
    });
    setShowLaborDialog(false);
    setSearchQuery("");
  };

  // Add equipment from library
  const addEquipmentFromLibrary = (equipment: Equipment) => {
    appendEquipment({
      code: equipment.code || "",
      name: equipment.name,
      description: equipment.description || "",
      quantity: 1,
      unit: equipment.unit,
      unitPrice: Number(equipment.unitPrice),
      equipmentId: equipment.id,
    });
    setShowEquipmentDialog(false);
    setSearchQuery("");
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!activeOrganization?.id) {
      setError("Please select an organization first");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const materials = values.materials.map((material) => ({
        ...material,
        totalPrice: material.quantity * material.unitPrice,
      }));

      const labor = values.labor.map((item) => ({
        ...item,
        totalPrice: item.quantity * item.unitPrice,
      }));

      const equipment = values.equipment.map((item) => ({
        ...item,
        totalPrice: item.quantity * item.unitPrice,
      }));

      const totalPrice = [...materials, ...labor, ...equipment].reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );

      await createUPA.mutateAsync({
        title: values.title,
        description: values.description,
        code: values.code,
        unit: values.unit,
        hasAnnualMaintenance: values.hasAnnualMaintenance,
        maintenanceYears: values.maintenanceYears,
        annualMaintenanceRate: values.annualMaintenanceRate,
        materials,
        labor,
        equipment,
        organizationId: activeOrganization.id,
        totalPrice,
      });

      router.push("/unit-price-analyses");
      toast.success("Unit price analysis created successfully!");
    } catch (error) {
      console.error("Error creating unit price analysis:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create unit price analysis"
      );
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // New functions to handle creating and adding components
  const handleCreateMaterial = async (values: CreateMaterialInput) => {
    if (!activeOrganization) return;

    try {
      const newMaterial = await createMaterial.mutateAsync({
        ...values,
        organizationId: activeOrganization.id,
      });

      // Add the new material to the UPA
      addMaterialFromLibrary(newMaterial);

      // Close the dialog
      setShowAddMaterialDialog(false);

      toast.success("Material created and added to UPA");
    } catch (error) {
      console.error("Error creating material:", error);
      toast.error("Failed to create material");
    }
  };

  const handleCreateLabor = async (values: CreateLaborInput) => {
    if (!activeOrganization) return;

    try {
      const newLabor = await createLabor.mutateAsync({
        ...values,
        organizationId: activeOrganization.id,
      });

      // Add the new labor to the UPA
      addLaborFromLibrary(newLabor);

      // Close the dialog
      setShowAddLaborDialog(false);

      toast.success("Labor created and added to UPA");
    } catch (error) {
      console.error("Error creating labor:", error);
      toast.error("Failed to create labor");
    }
  };

  const handleCreateEquipment = async (values: CreateEquipmentInput) => {
    if (!activeOrganization) return;

    try {
      const newEquipment = await createEquipment.mutateAsync({
        ...values,
        organizationId: activeOrganization.id,
      });

      // Add the new equipment to the UPA
      addEquipmentFromLibrary(newEquipment);

      // Close the dialog
      setShowAddEquipmentDialog(false);

      toast.success("Equipment created and added to UPA");
    } catch (error) {
      console.error("Error creating equipment:", error);
      toast.error("Failed to create equipment");
    }
  };

  if (!activeOrganization) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">
          <p>Please select an organization to create a unit price analysis.</p>
        </div>
      </DashboardLayout>
    );
  }

  // Render the materials section with library integration
  const renderMaterialsSection = () => (
    <div className="space-y-4">
      <div className="overflow-hidden border rounded-md">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left py-2 px-4 font-medium">Name</th>
              <th className="text-left py-2 px-4 font-medium">Code</th>
              <th className="text-left py-2 px-4 font-medium">Unit</th>
              <th className="text-left py-2 px-4 font-medium">Quantity</th>
              <th className="text-left py-2 px-4 font-medium">Unit Price</th>
              <th className="text-right py-2 px-4 font-medium">Total</th>
              <th className="text-right py-2 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {materialFields.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-4 text-center text-muted-foreground"
                >
                  No materials added yet
                </td>
              </tr>
            ) : (
              materialFields.map((field, index) => (
                <tr key={field.id} className="border-t">
                  <td className="py-3 px-4">
                    <FormField
                      control={form.control}
                      name={`materials.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Input
                              placeholder="Material name"
                              {...field}
                              className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <FormField
                      control={form.control}
                      name={`materials.${index}.code`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Input
                              placeholder="Code"
                              {...field}
                              className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <FormField
                      control={form.control}
                      name={`materials.${index}.unit`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Input
                              placeholder="Unit"
                              {...field}
                              className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <FormField
                      control={form.control}
                      name={`materials.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                              className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <FormField
                      control={form.control}
                      name={`materials.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                              className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="py-3 px-4 text-right font-medium">
                    {formatCurrency(calculateMaterialTotal(index))}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMaterial(index)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render the labor section with library integration
  const renderLaborSection = () => (
    <div className="space-y-4">
      <div className="overflow-hidden border rounded-md">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left py-2 px-4 font-medium">Role</th>
              <th className="text-left py-2 px-4 font-medium">Code</th>
              <th className="text-left py-2 px-4 font-medium">Unit</th>
              <th className="text-left py-2 px-4 font-medium">Quantity</th>
              <th className="text-left py-2 px-4 font-medium">Unit Price</th>
              <th className="text-right py-2 px-4 font-medium">Total</th>
              <th className="text-right py-2 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {laborFields.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-4 text-center text-muted-foreground"
                >
                  No labor added yet
                </td>
              </tr>
            ) : (
              laborFields.map((field, index) => (
                <tr key={field.id} className="border-t">
                  <td className="py-3 px-4">
                    <FormField
                      control={form.control}
                      name={`labor.${index}.role`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Input
                              placeholder="Labor role"
                              {...field}
                              className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <FormField
                      control={form.control}
                      name={`labor.${index}.code`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Input
                              placeholder="Code"
                              {...field}
                              className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <FormField
                      control={form.control}
                      name={`labor.${index}.unit`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Input
                              placeholder="Unit"
                              {...field}
                              className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <FormField
                      control={form.control}
                      name={`labor.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                              className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <FormField
                      control={form.control}
                      name={`labor.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                              className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="py-3 px-4 text-right font-medium">
                    {formatCurrency(calculateLaborTotal(index))}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLabor(index)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render the equipment section with library integration
  const renderEquipmentSection = () => (
    <div className="space-y-4">
      <div className="overflow-hidden border rounded-md">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left py-2 px-4 font-medium">Name</th>
              <th className="text-left py-2 px-4 font-medium">Code</th>
              <th className="text-left py-2 px-4 font-medium">Unit</th>
              <th className="text-left py-2 px-4 font-medium">Quantity</th>
              <th className="text-left py-2 px-4 font-medium">Unit Price</th>
              <th className="text-right py-2 px-4 font-medium">Total</th>
              <th className="text-right py-2 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {equipmentFields.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-4 text-center text-muted-foreground"
                >
                  No equipment added yet
                </td>
              </tr>
            ) : (
              equipmentFields.map((field, index) => (
                <tr key={field.id} className="border-t">
                  <td className="py-3 px-4">
                    <FormField
                      control={form.control}
                      name={`equipment.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Input
                              placeholder="Equipment name"
                              {...field}
                              className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <FormField
                      control={form.control}
                      name={`equipment.${index}.code`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Input
                              placeholder="Code"
                              {...field}
                              className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <FormField
                      control={form.control}
                      name={`equipment.${index}.unit`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Input
                              placeholder="Unit"
                              {...field}
                              className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <FormField
                      control={form.control}
                      name={`equipment.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                              className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <FormField
                      control={form.control}
                      name={`equipment.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                              className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="py-3 px-4 text-right font-medium">
                    {formatCurrency(calculateEquipmentTotal(index))}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEquipment(index)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/unit-price-analyses">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Unit Price Analysis</h1>
            <p className="text-muted-foreground mt-1">
              Create a detailed cost analysis for a construction activity
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information Section */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter title" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive title for this unit price analysis
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter code" {...field} />
                      </FormControl>
                      <FormDescription>
                        Optional reference code for this analysis
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., m², m³, each" {...field} />
                      </FormControl>
                      <FormDescription>
                        The unit of measurement for this analysis
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter description"
                            className="resize-none min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Detailed description of what this analysis covers
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="hasAnnualMaintenance"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Include Annual Maintenance</FormLabel>
                          <FormDescription>
                            Calculate annual maintenance costs for this item
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("hasAnnualMaintenance") && (
                  <>
                    <FormField
                      control={form.control}
                      name="maintenanceYears"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maintenance Years*</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="e.g., 5"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined;
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Number of years to calculate maintenance for
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="annualMaintenanceRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Annual Maintenance Rate (%)*</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="e.g., 2.5"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined;
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Percentage of initial cost for annual maintenance
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Materials Section */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Materials</h2>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMaterialsDialog(true)}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Add from Library
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddMaterialDialog(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New
                  </Button>
                </div>
              </div>
              {renderMaterialsSection()}
            </div>

            {/* Labor Section */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Labor</h2>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLaborDialog(true)}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Add from Library
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddLaborDialog(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New
                  </Button>
                </div>
              </div>
              {renderLaborSection()}
            </div>

            {/* Equipment Section */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Equipment</h2>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEquipmentDialog(true)}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Add from Library
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddEquipmentDialog(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New
                  </Button>
                </div>
              </div>
              {renderEquipmentSection()}
            </div>

            {/* Summary Section */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Materials Total</span>
                  <span>
                    {formatCurrency(
                      form
                        .watch("materials")
                        .reduce(
                          (sum, material, index) =>
                            sum + calculateMaterialTotal(index),
                          0
                        )
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Labor Total</span>
                  <span>
                    {formatCurrency(
                      form
                        .watch("labor")
                        .reduce(
                          (sum, labor, index) =>
                            sum + calculateLaborTotal(index),
                          0
                        )
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Equipment Total</span>
                  <span>
                    {formatCurrency(
                      form
                        .watch("equipment")
                        .reduce(
                          (sum, equipment, index) =>
                            sum + calculateEquipmentTotal(index),
                          0
                        )
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 font-bold text-lg">
                  <span>Grand Total</span>
                  <span>{formatCurrency(calculateGrandTotal())}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/unit-price-analyses")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create UPA"}
              </Button>
            </div>
          </form>
        </Form>

        {/* New Dialog for creating and adding a new material */}
        <Dialog
          open={showAddMaterialDialog}
          onOpenChange={setShowAddMaterialDialog}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Material</DialogTitle>
              <DialogDescription>
                Create a new material and add it to your library and this UPA
              </DialogDescription>
            </DialogHeader>

            <NewMaterialForm onSubmit={handleCreateMaterial} />
          </DialogContent>
        </Dialog>

        {/* New Dialog for creating and adding new labor */}
        <Dialog open={showAddLaborDialog} onOpenChange={setShowAddLaborDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Labor</DialogTitle>
              <DialogDescription>
                Create a new labor role and add it to your library and this UPA
              </DialogDescription>
            </DialogHeader>

            <NewLaborForm onSubmit={handleCreateLabor} />
          </DialogContent>
        </Dialog>

        {/* New Dialog for creating and adding new equipment */}
        <Dialog
          open={showAddEquipmentDialog}
          onOpenChange={setShowAddEquipmentDialog}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Equipment</DialogTitle>
              <DialogDescription>
                Create a new equipment and add it to your library and this UPA
              </DialogDescription>
            </DialogHeader>

            <NewEquipmentForm onSubmit={handleCreateEquipment} />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

// New component for creating materials
function NewMaterialForm({
  onSubmit,
}: {
  onSubmit: (values: CreateMaterialInput) => Promise<void>;
}) {
  const materialFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    code: z.string().optional(),
    description: z.string().optional(),
    unit: z.string().min(1, "Unit is required"),
    unitPrice: z.number().min(0, "Price must be a positive number"),
    isPublic: z.boolean().default(false),
  });

  type MaterialFormValues = z.infer<typeof materialFormSchema>;

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      unit: "",
      unitPrice: 0,
      isPublic: false,
    },
  });

  const handleSubmit = (values: MaterialFormValues) => {
    onSubmit(values as CreateMaterialInput);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name*</FormLabel>
              <FormControl>
                <Input placeholder="Material name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <Input placeholder="Material code" {...field} />
              </FormControl>
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
                  placeholder="Material description"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit*</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., m², kg, each" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unitPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Price*</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value
                        ? parseFloat(e.target.value)
                        : 0;
                      field.onChange(value);
                    }}
                  />
                </FormControl>
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
                  Allow other organizations to use this material
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit">Create & Add</Button>
        </div>
      </form>
    </Form>
  );
}

// New component for creating labor
function NewLaborForm({
  onSubmit,
}: {
  onSubmit: (values: CreateLaborInput) => Promise<void>;
}) {
  const laborFormSchema = z.object({
    role: z.string().min(1, "Role is required"),
    code: z.string().optional(),
    description: z.string().optional(),
    unit: z.string().min(1, "Unit is required"),
    unitPrice: z.number().min(0, "Price must be a positive number"),
    isPublic: z.boolean().default(false),
  });

  type LaborFormValues = z.infer<typeof laborFormSchema>;

  const form = useForm<LaborFormValues>({
    resolver: zodResolver(laborFormSchema),
    defaultValues: {
      role: "",
      code: "",
      description: "",
      unit: "",
      unitPrice: 0,
      isPublic: false,
    },
  });

  const handleSubmit = (values: LaborFormValues) => {
    onSubmit(values as CreateLaborInput);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role*</FormLabel>
              <FormControl>
                <Input placeholder="Labor role" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <Input placeholder="Labor code" {...field} />
              </FormControl>
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
                  placeholder="Labor description"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit*</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., hour, day" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unitPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Price*</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value
                        ? parseFloat(e.target.value)
                        : 0;
                      field.onChange(value);
                    }}
                  />
                </FormControl>
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
                  Allow other organizations to use this labor role
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit">Create & Add</Button>
        </div>
      </form>
    </Form>
  );
}

// New component for creating equipment
function NewEquipmentForm({
  onSubmit,
}: {
  onSubmit: (values: CreateEquipmentInput) => Promise<void>;
}) {
  const equipmentFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    code: z.string().optional(),
    description: z.string().optional(),
    unit: z.string().min(1, "Unit is required"),
    unitPrice: z.number().min(0, "Price must be a positive number"),
    isPublic: z.boolean().default(false),
  });

  type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      unit: "",
      unitPrice: 0,
      isPublic: false,
    },
  });

  const handleSubmit = (values: EquipmentFormValues) => {
    onSubmit(values as CreateEquipmentInput);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name*</FormLabel>
              <FormControl>
                <Input placeholder="Equipment name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <Input placeholder="Equipment code" {...field} />
              </FormControl>
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
                  placeholder="Equipment description"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit*</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., hour, day" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unitPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Price*</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value
                        ? parseFloat(e.target.value)
                        : 0;
                      field.onChange(value);
                    }}
                  />
                </FormControl>
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
                  Allow other organizations to use this equipment
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit">Create & Add</Button>
        </div>
      </form>
    </Form>
  );
}
