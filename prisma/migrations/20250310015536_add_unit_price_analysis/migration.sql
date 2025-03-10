-- CreateTable
CREATE TABLE "UnitPriceAnalysis" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT,
    "unit" TEXT NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitPriceAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UPAMaterial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "unitPriceAnalysisId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UPAMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UPALabor" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "unitPriceAnalysisId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UPALabor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UPAEquipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "unitPriceAnalysisId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UPAEquipment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UnitPriceAnalysis" ADD CONSTRAINT "UnitPriceAnalysis_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UPAMaterial" ADD CONSTRAINT "UPAMaterial_unitPriceAnalysisId_fkey" FOREIGN KEY ("unitPriceAnalysisId") REFERENCES "UnitPriceAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UPALabor" ADD CONSTRAINT "UPALabor_unitPriceAnalysisId_fkey" FOREIGN KEY ("unitPriceAnalysisId") REFERENCES "UnitPriceAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UPAEquipment" ADD CONSTRAINT "UPAEquipment_unitPriceAnalysisId_fkey" FOREIGN KEY ("unitPriceAnalysisId") REFERENCES "UnitPriceAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
