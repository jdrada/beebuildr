-- AlterTable
ALTER TABLE "UPAEquipment" ADD COLUMN     "equipmentId" TEXT;

-- AlterTable
ALTER TABLE "UPALabor" ADD COLUMN     "laborId" TEXT;

-- AlterTable
ALTER TABLE "UPAMaterial" ADD COLUMN     "materialId" TEXT;

-- CreateIndex
CREATE INDEX "UPAEquipment_equipmentId_idx" ON "UPAEquipment"("equipmentId");

-- CreateIndex
CREATE INDEX "UPALabor_laborId_idx" ON "UPALabor"("laborId");

-- CreateIndex
CREATE INDEX "UPAMaterial_materialId_idx" ON "UPAMaterial"("materialId");

-- AddForeignKey
ALTER TABLE "UPAMaterial" ADD CONSTRAINT "UPAMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UPALabor" ADD CONSTRAINT "UPALabor_laborId_fkey" FOREIGN KEY ("laborId") REFERENCES "Labor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UPAEquipment" ADD CONSTRAINT "UPAEquipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
