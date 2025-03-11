"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, PackageOpen, Keyboard } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/spinner";
import { ComponentEditModal } from "@/components/ui/component-edit-modal";
import {
  useMaterials,
  useLabor,
  useEquipment,
  Material,
  Labor,
  Equipment,
} from "@/hooks/useComponentsLibrary";

// Base interfaces
interface MaterialWithUsage extends Material {
  usageCount?: number;
  inUse?: boolean;
}

interface LaborWithUsage extends Labor {
  usageCount?: number;
  inUse?: boolean;
}

interface EquipmentWithUsage extends Equipment {
  usageCount?: number;
  inUse?: boolean;
}

// Define a union type for all component types
type ComponentItem = (
  | MaterialWithUsage
  | LaborWithUsage
  | EquipmentWithUsage
) & {
  type?: "material" | "labor" | "equipment";
};

// Add a helper function to format the price
const formatPrice = (price: number | string | null | undefined): string => {
  // Ensure price is a number
  const numericPrice =
    typeof price === "number" ? price : parseFloat(price || "0");
  return isNaN(numericPrice) ? "$0.00" : `$${numericPrice.toFixed(2)}`;
};

export default function ComponentsLibraryPage() {
  const { activeOrganization } = useActiveOrganization();
  const [searchQuery, setSearchQuery] = useState("");
  const [componentType, setComponentType] = useState<
    "all" | "materials" | "labor" | "equipment"
  >("all");
  const [showInUseOnly, setShowInUseOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "code" | "price" | "usage">(
    "name"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editComponent, setEditComponent] = useState<ComponentItem | null>(
    null
  );
  const [editComponentType, setEditComponentType] = useState<
    "material" | "labor" | "equipment"
  >("material");
  const [isShortcutsDialogOpen, setIsShortcutsDialogOpen] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Shortcuts for filtering
      if (e.key === "/" && !editModalOpen) {
        e.preventDefault();
        document.getElementById("search")?.focus();
      }

      // Show keyboard shortcuts
      if (e.key === "?" && !editModalOpen) {
        e.preventDefault();
        setIsShortcutsDialogOpen(true);
      }

      // Shortcuts for component types
      if (!editModalOpen && e.altKey) {
        switch (e.key) {
          case "a":
            e.preventDefault();
            setComponentType("all");
            break;
          case "m":
            e.preventDefault();
            setComponentType("materials");
            break;
          case "l":
            e.preventDefault();
            setComponentType("labor");
            break;
          case "e":
            e.preventDefault();
            setComponentType("equipment");
            break;
        }
      }

      // Escape to close modal
      if (e.key === "Escape" && editModalOpen) {
        setEditModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editModalOpen, setComponentType]);

  // Use React Query hooks
  const {
    data: materialsData,
    isLoading: materialsLoading,
    error: materialsError,
  } = useMaterials(activeOrganization?.id);

  const {
    data: laborData,
    isLoading: laborLoading,
    error: laborError,
  } = useLabor(activeOrganization?.id);

  const {
    data: equipmentData,
    isLoading: equipmentLoading,
    error: equipmentError,
  } = useEquipment(activeOrganization?.id);

  // Determine overall loading and error states
  const isLoading = materialsLoading || laborLoading || equipmentLoading;
  const error = materialsError || laborError || equipmentError;

  // Extract data from query results
  const materials = materialsData?.materials || [];
  const labor = laborData?.labor || [];
  const equipment = equipmentData?.equipment || [];

  // Filter and sort functions
  const filterBySearch = (item: ComponentItem) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();

    // Check common fields
    if (item.code?.toLowerCase().includes(query)) return true;
    if (item.description?.toLowerCase().includes(query)) return true;
    if (item.unit?.toLowerCase().includes(query)) return true;

    // Check type-specific fields
    if ("name" in item && item.name?.toLowerCase().includes(query)) return true;
    if ("role" in item && item.role?.toLowerCase().includes(query)) return true;

    return false;
  };

  const filterByUsage = (item: ComponentItem) => {
    if (!showInUseOnly) return true;
    return item.inUse === true;
  };

  const filterByType = (type: string) => {
    return componentType === "all" || componentType === type;
  };

  const getSortValue = (item: ComponentItem) => {
    switch (sortBy) {
      case "name":
        return "name" in item ? item.name : "role" in item ? item.role : "";
      case "code":
        return item.code || "";
      case "price":
        return item.unitPrice || 0;
      case "usage":
        return item.usageCount || 0;
      default:
        return "";
    }
  };

  const sortItems = (a: ComponentItem, b: ComponentItem) => {
    const aValue = getSortValue(a);
    const bValue = getSortValue(b);

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    }

    const aString = String(aValue).toLowerCase();
    const bString = String(bValue).toLowerCase();

    return sortOrder === "asc"
      ? aString.localeCompare(bString)
      : bString.localeCompare(aString);
  };

  // Apply filters and sorting
  const filteredMaterials = filterByType("materials")
    ? materials
        .filter(
          (item: MaterialWithUsage) =>
            filterBySearch(item) && filterByUsage(item)
        )
        .sort(sortItems)
    : [];

  const filteredLabor = filterByType("labor")
    ? labor
        .filter(
          (item: LaborWithUsage) => filterBySearch(item) && filterByUsage(item)
        )
        .sort(sortItems)
    : [];

  const filteredEquipment = filterByType("equipment")
    ? equipment
        .filter(
          (item: EquipmentWithUsage) =>
            filterBySearch(item) && filterByUsage(item)
        )
        .sort(sortItems)
    : [];

  // Combined list for "all" view
  const allComponents = [
    ...filteredMaterials.map((item: MaterialWithUsage) => ({
      ...item,
      type: "material" as const,
    })),
    ...filteredLabor.map((item: LaborWithUsage) => ({
      ...item,
      type: "labor" as const,
    })),
    ...filteredEquipment.map((item: EquipmentWithUsage) => ({
      ...item,
      type: "equipment" as const,
    })),
  ].sort(sortItems);

  const handleSortChange = (field: "name" | "code" | "price" | "usage") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const renderSortIcon = (field: "name" | "code" | "price" | "usage") => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? "↑" : "↓";
  };

  const getComponentTypeLabel = (type: string) => {
    switch (type) {
      case "material":
        return "Material";
      case "labor":
        return "Labor";
      case "equipment":
        return "Equipment";
      default:
        return "";
    }
  };

  const getComponentName = (item: ComponentItem) => {
    if ("name" in item) return item.name;
    if ("role" in item) return item.role;
    return "";
  };

  const handleEditComponent = (item: ComponentItem) => {
    setEditComponent(item);
    // Set the component type based on the item type or infer it
    if (item.type) {
      setEditComponentType(item.type);
    } else if ("name" in item && !("role" in item)) {
      setEditComponentType("material");
    } else if ("role" in item) {
      setEditComponentType("labor");
    } else {
      setEditComponentType("equipment");
    }
    setEditModalOpen(true);
  };

  if (!activeOrganization) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-10">
          <h1 className="text-2xl font-bold">Components Library</h1>
          <p className="text-muted-foreground">
            Please select an organization to view its components library.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-10">
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">
              {error instanceof Error
                ? error.message
                : "An unknown error occurred"}
            </span>
            <p className="mt-2">
              Please try refreshing the page or contact support if the problem
              persists.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Components Library</h1>
            <p className="text-muted-foreground">
              Manage your materials, labor, and equipment components
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsShortcutsDialogOpen(true)}
              title="Show keyboard shortcuts"
              className="mr-2"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
            <Button asChild>
              <Link
                href="/components-library/materials/new"
                title="Alt+M to filter materials"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Material
              </Link>
            </Button>
            <Button asChild>
              <Link
                href="/components-library/labor/new"
                title="Alt+L to filter labor"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Labor
              </Link>
            </Button>
            <Button asChild>
              <Link
                href="/components-library/equipment/new"
                title="Alt+E to filter equipment"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Equipment
              </Link>
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg border shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name, code, etc."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="componentType">Component Type</Label>
              <Select
                value={componentType}
                onValueChange={(value: string) =>
                  setComponentType(
                    value as "all" | "materials" | "labor" | "equipment"
                  )
                }
              >
                <SelectTrigger id="componentType" className="mt-1">
                  <SelectValue placeholder="Select component type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Components</SelectItem>
                  <SelectItem value="materials">Materials</SelectItem>
                  <SelectItem value="labor">Labor</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showInUseOnly"
                  checked={showInUseOnly}
                  onCheckedChange={(checked) => setShowInUseOnly(!!checked)}
                />
                <Label htmlFor="showInUseOnly">
                  Show in-use components only
                </Label>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner className="h-8 w-8" />
          </div>
        ) : (
          <div className="bg-card rounded-lg border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSortChange("code")}
                  >
                    Code {renderSortIcon("code")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSortChange("name")}
                  >
                    Name/Role {renderSortIcon("name")}
                  </TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead
                    className="cursor-pointer text-right"
                    onClick={() => handleSortChange("price")}
                  >
                    Unit Price {renderSortIcon("price")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-center"
                    onClick={() => handleSortChange("usage")}
                  >
                    Usage {renderSortIcon("usage")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {componentType === "all" ? (
                  allComponents.length > 0 ? (
                    allComponents.map((item) => (
                      <TableRow
                        key={`${item.type}-${item.id}`}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleEditComponent(item)}
                      >
                        <TableCell>
                          <Badge variant="outline">
                            {getComponentTypeLabel(item.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.code || "-"}</TableCell>
                        <TableCell>{getComponentName(item)}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-right">
                          {formatPrice(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.inUse ? (
                            <Badge variant="secondary">
                              In use ({item.usageCount || 0})
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">
                              Not in use
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        <div className="flex flex-col items-center justify-center">
                          <PackageOpen className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">
                            No components found
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                ) : componentType === "materials" ? (
                  filteredMaterials.length > 0 ? (
                    filteredMaterials.map((material: MaterialWithUsage) => (
                      <TableRow
                        key={material.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleEditComponent(material)}
                      >
                        <TableCell>
                          <Badge variant="outline">Material</Badge>
                        </TableCell>
                        <TableCell>{material.code || "-"}</TableCell>
                        <TableCell>{material.name}</TableCell>
                        <TableCell>{material.unit}</TableCell>
                        <TableCell className="text-right">
                          {formatPrice(material.unitPrice)}
                        </TableCell>
                        <TableCell className="text-center">
                          {material.inUse ? (
                            <Badge variant="secondary">
                              In use ({material.usageCount || 0})
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">
                              Not in use
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        <div className="flex flex-col items-center justify-center">
                          <PackageOpen className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">
                            No materials found
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                ) : componentType === "labor" ? (
                  filteredLabor.length > 0 ? (
                    filteredLabor.map((labor: LaborWithUsage) => (
                      <TableRow
                        key={labor.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleEditComponent(labor)}
                      >
                        <TableCell>
                          <Badge variant="outline">Labor</Badge>
                        </TableCell>
                        <TableCell>{labor.code || "-"}</TableCell>
                        <TableCell>{labor.role}</TableCell>
                        <TableCell>{labor.unit}</TableCell>
                        <TableCell className="text-right">
                          {formatPrice(labor.unitPrice)}
                        </TableCell>
                        <TableCell className="text-center">
                          {labor.inUse ? (
                            <Badge variant="secondary">
                              In use ({labor.usageCount || 0})
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">
                              Not in use
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        <div className="flex flex-col items-center justify-center">
                          <PackageOpen className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">
                            No labor found
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                ) : filteredEquipment.length > 0 ? (
                  filteredEquipment.map((equipment: EquipmentWithUsage) => (
                    <TableRow
                      key={equipment.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleEditComponent(equipment)}
                    >
                      <TableCell>
                        <Badge variant="outline">Equipment</Badge>
                      </TableCell>
                      <TableCell>{equipment.code || "-"}</TableCell>
                      <TableCell>{equipment.name}</TableCell>
                      <TableCell>{equipment.unit}</TableCell>
                      <TableCell className="text-right">
                        {formatPrice(equipment.unitPrice)}
                      </TableCell>
                      <TableCell className="text-center">
                        {equipment.inUse ? (
                          <Badge variant="secondary">
                            In use ({equipment.usageCount || 0})
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">
                            Not in use
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center">
                        <PackageOpen className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          No equipment found
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      {editModalOpen && editComponent && (
        <ComponentEditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          componentType={editComponentType}
          component={editComponent}
        />
      )}
      {/* Keyboard Shortcuts Dialog */}
      <Dialog
        open={isShortcutsDialogOpen}
        onOpenChange={setIsShortcutsDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="font-semibold">Search</div>
              <div>
                <kbd className="px-2 py-1 bg-muted rounded">/</kbd>
              </div>

              <div className="font-semibold">Show this help</div>
              <div>
                <kbd className="px-2 py-1 bg-muted rounded">?</kbd>
              </div>

              <div className="font-semibold">Show all components</div>
              <div>
                <kbd className="px-2 py-1 bg-muted rounded">Alt</kbd> +{" "}
                <kbd className="px-2 py-1 bg-muted rounded">A</kbd>
              </div>

              <div className="font-semibold">Show materials</div>
              <div>
                <kbd className="px-2 py-1 bg-muted rounded">Alt</kbd> +{" "}
                <kbd className="px-2 py-1 bg-muted rounded">M</kbd>
              </div>

              <div className="font-semibold">Show labor</div>
              <div>
                <kbd className="px-2 py-1 bg-muted rounded">Alt</kbd> +{" "}
                <kbd className="px-2 py-1 bg-muted rounded">L</kbd>
              </div>

              <div className="font-semibold">Show equipment</div>
              <div>
                <kbd className="px-2 py-1 bg-muted rounded">Alt</kbd> +{" "}
                <kbd className="px-2 py-1 bg-muted rounded">E</kbd>
              </div>

              <div className="font-semibold">Close dialogs</div>
              <div>
                <kbd className="px-2 py-1 bg-muted rounded">Esc</kbd>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
