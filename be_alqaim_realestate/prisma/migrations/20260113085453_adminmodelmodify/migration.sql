/*
  Warnings:

  - You are about to drop the `UserAdmin` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "UserAdmin";

-- CreateTable
CREATE TABLE "userAdmin" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "otp" TEXT,
    "otpExpiry" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "authtoken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "userAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "userAdmin_email_key" ON "userAdmin"("email");
