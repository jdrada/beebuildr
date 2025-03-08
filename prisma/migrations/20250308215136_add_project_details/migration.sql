-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'INSTITUTIONAL', 'INFRASTRUCTURE', 'RENOVATION', 'OTHER');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "billingAddress" TEXT,
ADD COLUMN     "clientEmail" TEXT,
ADD COLUMN     "clientName" TEXT,
ADD COLUMN     "clientPhone" TEXT,
ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "projectAddress" TEXT,
ADD COLUMN     "projectScope" TEXT,
ADD COLUMN     "projectType" "ProjectType" DEFAULT 'RESIDENTIAL',
ADD COLUMN     "startDate" TIMESTAMP(3);
