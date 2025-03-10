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
import {
  useCreateUnitPriceAnalysis,
  type UPAMaterial,
  type UPALabor,
  type UPAEquipment,
} from "@/hooks/useUnitPriceAnalysis";
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
} from "@/hooks/useComponentsLibrary";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [activeTab, setActiveTab] = useState("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMaterialsDialog, setShowMaterialsDialog] = useState(false);
  const [showLaborDialog, setShowLaborDialog] = useState(false);
  const [showEquipmentDialog, setShowEquipmentDialog] = useState(false);

  // Fetch components library data
  const { data: materialsData } = useMaterials(activeOrganization?.id);
  const { data: laborData } = useLabor(activeOrganization?.id);
  const { data: equipmentData } = useEquipment(activeOrganization?.id);

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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Materials</h3>
        <div className="flex space-x-2">
          <Dialog
            open={showMaterialsDialog}
            onOpenChange={setShowMaterialsDialog}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                From Library
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Select Material from Library</DialogTitle>
                <DialogDescription>
                  Choose a material from your components library
                </DialogDescription>
              </DialogHeader>

              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                  type="search"
                />
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Code</th>
                      <th className="text-left py-2 px-4">Name</th>
                      <th className="text-left py-2 px-4">Unit</th>
                      <th className="text-left py-2 px-4">Price</th>
                      <th className="text-right py-2 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMaterials?.map((material) => (
                      <tr
                        key={material.id}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="py-2 px-4">{material.code || "-"}</td>
                        <td className="py-2 px-4">{material.name}</td>
                        <td className="py-2 px-4">{material.unit}</td>
                        <td className="py-2 px-4">
                          {formatCurrency(material.unitPrice)}
                        </td>
                        <td className="py-2 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addMaterialFromLibrary(material)}
                          >
                            Add
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredMaterials?.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-4 text-center text-muted-foreground"
                        >
                          No materials found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendMaterial({
                code: "",
                name: "",
                description: "",
                quantity: 1,
                unit: "",
                unitPrice: 0,
              })
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Material
          </Button>
        </div>
      </div>

      {materialFields.map((field, index) => (
        <Card key={field.id}>
          <CardHeader className="pb-2 flex flex-row justify-between items-start">
            <CardTitle className="text-base">Material {index + 1}</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeMaterial(index)}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name={`materials.${index}.name`}
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
              name={`materials.${index}.code`}
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
              name={`materials.${index}.description`}
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

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name={`materials.${index}.quantity`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`materials.${index}.unit`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit*</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., kg, m2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`materials.${index}.unitPrice`}
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-medium">
                  {formatCurrency(calculateMaterialTotal(index))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render the labor section with library integration
  const renderLaborSection = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Labor</h3>
        <div className="flex space-x-2">
          <Dialog open={showLaborDialog} onOpenChange={setShowLaborDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                From Library
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Select Labor from Library</DialogTitle>
                <DialogDescription>
                  Choose labor from your components library
                </DialogDescription>
              </DialogHeader>

              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search labor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                  type="search"
                />
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Code</th>
                      <th className="text-left py-2 px-4">Role</th>
                      <th className="text-left py-2 px-4">Unit</th>
                      <th className="text-left py-2 px-4">Price</th>
                      <th className="text-right py-2 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLabor?.map((labor) => (
                      <tr key={labor.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-4">{labor.code || "-"}</td>
                        <td className="py-2 px-4">{labor.role}</td>
                        <td className="py-2 px-4">{labor.unit}</td>
                        <td className="py-2 px-4">
                          {formatCurrency(labor.unitPrice)}
                        </td>
                        <td className="py-2 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addLaborFromLibrary(labor)}
                          >
                            Add
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredLabor?.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-4 text-center text-muted-foreground"
                        >
                          No labor found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendLabor({
                code: "",
                role: "",
                description: "",
                quantity: 1,
                unit: "",
                unitPrice: 0,
              })
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Labor
          </Button>
        </div>
      </div>

      {laborFields.map((field, index) => (
        <Card key={field.id}>
          <CardHeader className="pb-2 flex flex-row justify-between items-start">
            <CardTitle className="text-base">Labor {index + 1}</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeLabor(index)}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name={`labor.${index}.role`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role*</FormLabel>
                  <FormControl>
                    <Input placeholder="Worker role" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`labor.${index}.code`}
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
              name={`labor.${index}.description`}
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

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name={`labor.${index}.quantity`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`labor.${index}.unit`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit*</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., hours, days" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`labor.${index}.unitPrice`}
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-medium">
                  {formatCurrency(calculateLaborTotal(index))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render the equipment section with library integration
  const renderEquipmentSection = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Equipment</h3>
        <div className="flex space-x-2">
          <Dialog
            open={showEquipmentDialog}
            onOpenChange={setShowEquipmentDialog}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                From Library
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Select Equipment from Library</DialogTitle>
                <DialogDescription>
                  Choose equipment from your components library
                </DialogDescription>
              </DialogHeader>

              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search equipment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                  type="search"
                />
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Code</th>
                      <th className="text-left py-2 px-4">Name</th>
                      <th className="text-left py-2 px-4">Unit</th>
                      <th className="text-left py-2 px-4">Price</th>
                      <th className="text-right py-2 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEquipment?.map((equipment) => (
                      <tr
                        key={equipment.id}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="py-2 px-4">{equipment.code || "-"}</td>
                        <td className="py-2 px-4">{equipment.name}</td>
                        <td className="py-2 px-4">{equipment.unit}</td>
                        <td className="py-2 px-4">
                          {formatCurrency(equipment.unitPrice)}
                        </td>
                        <td className="py-2 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addEquipmentFromLibrary(equipment)}
                          >
                            Add
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredEquipment?.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-4 text-center text-muted-foreground"
                        >
                          No equipment found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendEquipment({
                code: "",
                name: "",
                description: "",
                quantity: 1,
                unit: "",
                unitPrice: 0,
              })
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Equipment
          </Button>
        </div>
      </div>

      {equipmentFields.map((field, index) => (
        <Card key={field.id}>
          <CardHeader className="pb-2 flex flex-row justify-between items-start">
            <CardTitle className="text-base">Equipment {index + 1}</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeEquipment(index)}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name={`equipment.${index}.name`}
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
              name={`equipment.${index}.code`}
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
              name={`equipment.${index}.description`}
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

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name={`equipment.${index}.quantity`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`equipment.${index}.unit`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit*</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., hours, days" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`equipment.${index}.unitPrice`}
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-medium">
                  {formatCurrency(calculateEquipmentTotal(index))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
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
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="materials">Materials</TabsTrigger>
                <TabsTrigger value="labor">Labor</TabsTrigger>
                <TabsTrigger value="equipment">Equipment</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4 pt-4">
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
                        Additional details about this analysis
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter code (optional)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional reference code
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
                          <Input placeholder="e.g., m2, m3, each" {...field} />
                        </FormControl>
                        <FormDescription>
                          Unit of measurement (m2, m3, etc.)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
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
                            Enable this to add annual maintenance costs to the
                            analysis
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch("hasAnnualMaintenance") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="maintenanceYears"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maintenance Years</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="e.g., 10"
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? parseInt(e.target.value)
                                      : null
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Number of years to calculate maintenance costs
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
                            <FormLabel>Annual Maintenance Rate (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                placeholder="e.g., 2.5"
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? parseFloat(e.target.value)
                                      : null
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Percentage of total cost for annual maintenance
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Materials Tab */}
              <TabsContent value="materials" className="space-y-4 pt-4">
                {renderMaterialsSection()}
              </TabsContent>

              {/* Labor Tab */}
              <TabsContent value="labor" className="space-y-4 pt-4">
                {renderLaborSection()}
              </TabsContent>

              {/* Equipment Tab */}
              <TabsContent value="equipment" className="space-y-4 pt-4">
                {renderEquipmentSection()}
              </TabsContent>
            </Tabs>

            <div className="flex justify-between items-center pt-4 border-t">
              <div>
                <p className="text-lg font-semibold">Grand Total</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(calculateGrandTotal())}
                </p>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" asChild>
                  <Link href="/unit-price-analyses">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Analysis"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
