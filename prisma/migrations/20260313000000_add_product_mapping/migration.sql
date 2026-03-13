-- CreateTable
CREATE TABLE "ProductMapping" (
    "id" TEXT NOT NULL,
    "genericName" TEXT NOT NULL,
    "hebProductId" TEXT NOT NULL,
    "hebProductName" TEXT NOT NULL,
    "hebBrand" TEXT,
    "hebPrice" DOUBLE PRECISION,
    "hebSize" TEXT,
    "hebImageUrl" TEXT,
    "householdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductMapping_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "GroceryItem" ADD COLUMN "productMappingId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ProductMapping_householdId_hebProductId_key" ON "ProductMapping"("householdId", "hebProductId");

-- AddForeignKey
ALTER TABLE "GroceryItem" ADD CONSTRAINT "GroceryItem_productMappingId_fkey" FOREIGN KEY ("productMappingId") REFERENCES "ProductMapping"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMapping" ADD CONSTRAINT "ProductMapping_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "HouseholdProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
