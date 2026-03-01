import { getOrCreateHousehold } from "@/app/settings/actions";
import { AllergenTrackerView } from "@/components/allergen/allergen-tracker-view";
import { db } from "@/lib/db";

export default async function AllergenTrackerPage() {
  const household = await getOrCreateHousehold();

  const children = await db.child.findMany({
    where: { householdId: household.id },
    include: { allergenLogs: { orderBy: { introducedAt: "desc" } } },
  });

  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-28">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Allergen Tracker
        </h1>
        <p className="text-muted-foreground text-sm">
          Track allergen introductions for your little ones.
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="h-0.5 w-8 rounded-full bg-primary/60" />
          <div className="h-0.5 w-3 rounded-full bg-primary/30" />
          <div className="h-0.5 w-1.5 rounded-full bg-primary/15" />
        </div>
      </div>
      <div className="animate-fade-up">
        <AllergenTrackerView initialChildren={children} />
      </div>
    </div>
  );
}
