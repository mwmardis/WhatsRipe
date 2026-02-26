/*
  Warnings:

  - Added the required column `updatedAt` to the `DailyPlan` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DailyPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayOfWeek" INTEGER NOT NULL,
    "weeklyPlanId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyPlan_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "WeeklyPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DailyPlan" ("createdAt", "dayOfWeek", "id", "weeklyPlanId") SELECT "createdAt", "dayOfWeek", "id", "weeklyPlanId" FROM "DailyPlan";
DROP TABLE "DailyPlan";
ALTER TABLE "new_DailyPlan" RENAME TO "DailyPlan";
CREATE UNIQUE INDEX "DailyPlan_weeklyPlanId_dayOfWeek_key" ON "DailyPlan"("weeklyPlanId", "dayOfWeek");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
