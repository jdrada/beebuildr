"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { Spinner } from "@/components/spinner";
import { MemberRole, OrganizationType } from "@prisma/client";
import {
  useMaterials,
  useLabor,
  useEquipment,
  Material,
  Labor,
  Equipment,
} from "@/hooks/useComponentsLibrary";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// Extended interfaces to include usage information
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

export default function ComponentsLibraryPage() {
  const [activeTab, setActiveTab] = useState("materials");
  const [searchQuery, setSearchQuery] = useState("");
  const { activeOrganization, activeRole } = useActiveOrganization();

  const { data: materialsData, isLoading: materialsLoading } = useMaterials(
    activeOrganization?.id
  );

  const { data: laborData, isLoading: laborLoading } = useLabor(
    activeOrganization?.id
  );

  const { data: equipmentData, isLoading: equipmentLoading } = useEquipment(
    activeOrganization?.id
  );

  const canCreateComponents =
    activeRole === MemberRole.ADMIN || activeRole === MemberRole.MEMBER;

  // Filter materials based on search query
  const filteredMaterials = materialsData?.materials?.filter(
    (material: MaterialWithUsage) =>
      material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (material.code?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  // Filter labor based on search query
  const filteredLabor = laborData?.labor?.filter(
    (labor: LaborWithUsage) =>
      labor.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (labor.code?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  // Filter equipment based on search query
  const filteredEquipment = equipmentData?.equipment?.filter(
    (equipment: EquipmentWithUsage) =>
      equipment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (equipment.code?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  if (!activeOrganization) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <EmptyState
          title="No Organization Selected"
          description="Please select an organization to view components library."
        />
      </div>
    );
  }

  if (activeOrganization.type !== OrganizationType.CONTRACTOR) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-10">
          <EmptyState
            title="Components Library"
            description="This feature is only available for contractor organizations."
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Components Library
            </h2>
            <p className="text-muted-foreground">
              Manage your reusable materials, labor, and equipment
            </p>
          </div>
          {canCreateComponents && activeTab === "materials" && (
            <Button asChild>
              <Link href="/components-library/materials/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Material
              </Link>
            </Button>
          )}
          {canCreateComponents && activeTab === "labor" && (
            <Button asChild>
              <Link href="/components-library/labor/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Labor
              </Link>
            </Button>
          )}
          {canCreateComponents && activeTab === "equipment" && (
            <Button asChild>
              <Link href="/components-library/equipment/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Equipment
              </Link>
            </Button>
          )}
        </div>

        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
            type="search"
          />
        </div>

        <Tabs
          defaultValue="materials"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="labor">Labor</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
          </TabsList>

          {/* Materials Tab */}
          <TabsContent value="materials">
            {materialsLoading ? (
              <div className="flex h-[400px] items-center justify-center">
                <Spinner />
              </div>
            ) : filteredMaterials?.length === 0 ? (
              <EmptyState
                title="No Materials"
                description="Create your first material to get started."
                action={
                  canCreateComponents && (
                    <Button asChild>
                      <Link href="/components-library/materials/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Material
                      </Link>
                    </Button>
                  )
                }
              />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Public</TableHead>
                      <TableHead>Usage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials?.map((material: MaterialWithUsage) => (
                      <TableRow
                        key={material.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          (window.location.href = `/components-library/materials/${material.id}/edit`)
                        }
                      >
                        <TableCell>{material.code || "-"}</TableCell>
                        <TableCell>{material.name}</TableCell>
                        <TableCell>{material.unit}</TableCell>
                        <TableCell>
                          {formatCurrency(material.unitPrice)}
                        </TableCell>
                        <TableCell>
                          {material.isPublic ? "Yes" : "No"}
                        </TableCell>
                        <TableCell>
                          {material.usageCount && material.usageCount > 0 ? (
                            <Badge variant="outline">
                              Used in {material.usageCount} UPAs
                            </Badge>
                          ) : (
                            "Not used"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Labor Tab */}
          <TabsContent value="labor">
            {laborLoading ? (
              <div className="flex h-[400px] items-center justify-center">
                <Spinner />
              </div>
            ) : filteredLabor?.length === 0 ? (
              <EmptyState
                title="No Labor"
                description="Create your first labor to get started."
                action={
                  canCreateComponents && (
                    <Button asChild>
                      <Link href="/components-library/labor/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Labor
                      </Link>
                    </Button>
                  )
                }
              />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Public</TableHead>
                      <TableHead>Usage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLabor?.map((labor: LaborWithUsage) => (
                      <TableRow
                        key={labor.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          (window.location.href = `/components-library/labor/${labor.id}/edit`)
                        }
                      >
                        <TableCell>{labor.code || "-"}</TableCell>
                        <TableCell>{labor.role}</TableCell>
                        <TableCell>{labor.unit}</TableCell>
                        <TableCell>{formatCurrency(labor.unitPrice)}</TableCell>
                        <TableCell>{labor.isPublic ? "Yes" : "No"}</TableCell>
                        <TableCell>
                          {labor.usageCount && labor.usageCount > 0 ? (
                            <Badge variant="outline">
                              Used in {labor.usageCount} UPAs
                            </Badge>
                          ) : (
                            "Not used"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Equipment Tab */}
          <TabsContent value="equipment">
            {equipmentLoading ? (
              <div className="flex h-[400px] items-center justify-center">
                <Spinner />
              </div>
            ) : filteredEquipment?.length === 0 ? (
              <EmptyState
                title="No Equipment"
                description="Create your first equipment to get started."
                action={
                  canCreateComponents && (
                    <Button asChild>
                      <Link href="/components-library/equipment/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Equipment
                      </Link>
                    </Button>
                  )
                }
              />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Public</TableHead>
                      <TableHead>Usage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEquipment?.map((equipment: EquipmentWithUsage) => (
                      <TableRow
                        key={equipment.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          (window.location.href = `/components-library/equipment/${equipment.id}/edit`)
                        }
                      >
                        <TableCell>{equipment.code || "-"}</TableCell>
                        <TableCell>{equipment.name}</TableCell>
                        <TableCell>{equipment.unit}</TableCell>
                        <TableCell>
                          {formatCurrency(equipment.unitPrice)}
                        </TableCell>
                        <TableCell>
                          {equipment.isPublic ? "Yes" : "No"}
                        </TableCell>
                        <TableCell>
                          {equipment.usageCount && equipment.usageCount > 0 ? (
                            <Badge variant="outline">
                              Used in {equipment.usageCount} UPAs
                            </Badge>
                          ) : (
                            "Not used"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
