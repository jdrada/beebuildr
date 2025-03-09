/*
  Warnings:

  - You are about to drop the column `projectId` on the `Budget` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Budget" DROP CONSTRAINT "Budget_projectId_fkey";

-- AlterTable
ALTER TABLE "Budget" DROP COLUMN "projectId",
ADD COLUMN     "isTemplate" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "BudgetProject" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetProject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BudgetProject_budgetId_projectId_key" ON "BudgetProject"("budgetId", "projectId");

-- AddForeignKey
ALTER TABLE "BudgetProject" ADD CONSTRAINT "BudgetProject_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetProject" ADD CONSTRAINT "BudgetProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
