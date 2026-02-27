-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Child" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "birthdate" DATETIME NOT NULL,
    "allergies" TEXT NOT NULL DEFAULT '[]',
    "feedingApproach" TEXT NOT NULL DEFAULT 'combination',
    "householdId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Child_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "HouseholdProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Child" ("allergies", "birthdate", "createdAt", "householdId", "id", "name", "updatedAt") SELECT "allergies", "birthdate", "createdAt", "householdId", "id", "name", "updatedAt" FROM "Child";
DROP TABLE "Child";
ALTER TABLE "new_Child" RENAME TO "Child";
CREATE TABLE "new_HouseholdProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dietaryPreferences" TEXT NOT NULL DEFAULT '[]',
    "allergies" TEXT NOT NULL DEFAULT '[]',
    "likedIngredients" TEXT NOT NULL DEFAULT '[]',
    "dislikedIngredients" TEXT NOT NULL DEFAULT '[]',
    "planBreakfast" BOOLEAN NOT NULL DEFAULT false,
    "planLunch" BOOLEAN NOT NULL DEFAULT false,
    "useSeasonalFoods" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_HouseholdProfile" ("allergies", "createdAt", "dietaryPreferences", "dislikedIngredients", "id", "likedIngredients", "planBreakfast", "planLunch", "updatedAt") SELECT "allergies", "createdAt", "dietaryPreferences", "dislikedIngredients", "id", "likedIngredients", "planBreakfast", "planLunch", "updatedAt" FROM "HouseholdProfile";
DROP TABLE "HouseholdProfile";
ALTER TABLE "new_HouseholdProfile" RENAME TO "HouseholdProfile";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
