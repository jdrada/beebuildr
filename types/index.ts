export interface UPAMaterial {
  id?: string;
  code?: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface UPALabor {
  id?: string;
  code?: string;
  role: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface UPAEquipment {
  id?: string;
  code?: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface UnitPriceAnalysis {
  id: string;
  title: string;
  description?: string | null;
  code?: string | null;
  unit: string;
  totalPrice: number;
  isPublic: boolean;
  hasAnnualMaintenance: boolean;
  maintenanceYears: number | null;
  annualMaintenanceRate: number | null;
  organizationId: string;
  materials: UPAMaterial[];
  labor: UPALabor[];
  equipment: UPAEquipment[];
  createdAt: string;
  updatedAt: string;
}
