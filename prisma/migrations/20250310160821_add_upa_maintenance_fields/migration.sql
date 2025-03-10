-- AlterTable
ALTER TABLE "UPAEquipment" ADD COLUMN     "code" TEXT,
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "UPALabor" ADD COLUMN     "code" TEXT,
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "UPAMaterial" ADD COLUMN     "code" TEXT,
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "UnitPriceAnalysis" ADD COLUMN     "annualMaintenanceRate" DECIMAL(5,2),
ADD COLUMN     "hasAnnualMaintenance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maintenanceYears" INTEGER;

-- CreateIndex
CREATE INDEX "UPAEquipment_unitPriceAnalysisId_idx" ON "UPAEquipment"("unitPriceAnalysisId");

-- CreateIndex
CREATE INDEX "UPALabor_unitPriceAnalysisId_idx" ON "UPALabor"("unitPriceAnalysisId");

-- CreateIndex
CREATE INDEX "UPAMaterial_unitPriceAnalysisId_idx" ON "UPAMaterial"("unitPriceAnalysisId");

-- CreateIndex
CREATE INDEX "UnitPriceAnalysis_organizationId_idx" ON "UnitPriceAnalysis"("organizationId");
