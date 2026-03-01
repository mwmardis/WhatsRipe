-- CreateTable
CREATE TABLE "HouseholdProfile" (
    "id" TEXT NOT NULL,
    "dietaryPreferences" TEXT NOT NULL DEFAULT '[]',
    "allergies" TEXT NOT NULL DEFAULT '[]',
    "likedIngredients" TEXT NOT NULL DEFAULT '[]',
    "dislikedIngredients" TEXT NOT NULL DEFAULT '[]',
    "planBreakfast" BOOLEAN NOT NULL DEFAULT false,
    "planLunch" BOOLEAN NOT NULL DEFAULT false,
    "useSeasonalFoods" BOOLEAN NOT NULL DEFAULT true,
    "busyDays" TEXT NOT NULL DEFAULT '[]',
    "pickyEaterMode" BOOLEAN NOT NULL DEFAULT false,
    "weeklyBudget" DOUBLE PRECISION,
    "mealPrepDay" INTEGER,
    "planWeeks" INTEGER NOT NULL DEFAULT 1,
    "preferredCookingMethods" TEXT NOT NULL DEFAULT '[]',
    "calendarExportEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseholdProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Child" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthdate" TIMESTAMP(3) NOT NULL,
    "allergies" TEXT NOT NULL DEFAULT '[]',
    "feedingApproach" TEXT NOT NULL DEFAULT 'combination',
    "householdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyPlan" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "householdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPlan" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "weeklyPlanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "seasonalIngredients" TEXT NOT NULL DEFAULT '[]',
    "recipe" TEXT,
    "babyAdaptations" TEXT,
    "freezerFriendly" BOOLEAN NOT NULL DEFAULT false,
    "estimatedPrepTime" INTEGER,
    "estimatedCookTime" INTEGER,
    "cookingMethod" TEXT NOT NULL DEFAULT 'standard',
    "estimatedCost" DOUBLE PRECISION,
    "leftoverTip" TEXT,
    "kidCookingTasks" TEXT,
    "dailyPlanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealRating" (
    "id" TEXT NOT NULL,
    "mealName" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "notes" TEXT,
    "mealId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MealRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryList" (
    "id" TEXT NOT NULL,
    "weeklyPlanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroceryList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "storeSection" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "manuallyAdded" BOOLEAN NOT NULL DEFAULT false,
    "groceryListId" TEXT NOT NULL,

    CONSTRAINT "GroceryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PantryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'count',
    "category" TEXT NOT NULL DEFAULT 'pantry',
    "expiresAt" TIMESTAMP(3),
    "householdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PantryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllergenLog" (
    "id" TEXT NOT NULL,
    "allergen" TEXT NOT NULL,
    "introducedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reaction" TEXT NOT NULL DEFAULT 'none',
    "notes" TEXT,
    "childId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AllergenLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "householdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyPlan_weeklyPlanId_dayOfWeek_key" ON "DailyPlan"("weeklyPlanId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "GroceryList_weeklyPlanId_key" ON "GroceryList"("weeklyPlanId");

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "HouseholdProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyPlan" ADD CONSTRAINT "WeeklyPlan_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "HouseholdProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPlan" ADD CONSTRAINT "DailyPlan_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "WeeklyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_dailyPlanId_fkey" FOREIGN KEY ("dailyPlanId") REFERENCES "DailyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealRating" ADD CONSTRAINT "MealRating_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryList" ADD CONSTRAINT "GroceryList_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "WeeklyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryItem" ADD CONSTRAINT "GroceryItem_groceryListId_fkey" FOREIGN KEY ("groceryListId") REFERENCES "GroceryList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "HouseholdProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllergenLog" ADD CONSTRAINT "AllergenLog_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "HouseholdProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
