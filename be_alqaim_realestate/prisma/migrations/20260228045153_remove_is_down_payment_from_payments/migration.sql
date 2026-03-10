/*
  Warnings:

  - You are about to drop the column `isDownPayment` on the `customerPayments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "downPayment" DOUBLE PRECISION,
ADD COLUMN     "paymentType" TEXT NOT NULL DEFAULT 'CASH',
ADD COLUMN     "totalInstallments" INTEGER;

-- AlterTable
ALTER TABLE "customerPayments" DROP COLUMN "isDownPayment";
