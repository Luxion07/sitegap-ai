-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('LOCAL_SERVICE', 'B2B_SERVICE', 'AGENCY_CONSULTING', 'OTHER_SERVICE');

-- CreateTable
CREATE TABLE "Audit" (
    "id" TEXT NOT NULL,
    "websiteUrl" TEXT NOT NULL,
    "businessType" "BusinessType" NOT NULL,
    "manualContext" TEXT,
    "status" "AuditStatus" NOT NULL DEFAULT 'PROCESSING',
    "statusMessage" TEXT,
    "sourceText" TEXT,
    "reportJson" JSONB,
    "previewJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Audit_createdAt_idx" ON "Audit"("createdAt");
