export const dynamic = "force-dynamic";

import { getPantryItems } from "@/app/actions/pantry-actions";
import { PantryView } from "@/components/pantry/pantry-view";

export default async function PantryPage() {
  const items = await getPantryItems();

  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-28">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Pantry
        </h1>
        <p className="text-muted-foreground text-sm">
          Track what you have on hand to smarter grocery lists.
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="h-0.5 w-8 rounded-full bg-primary/60" />
          <div className="h-0.5 w-3 rounded-full bg-primary/30" />
          <div className="h-0.5 w-1.5 rounded-full bg-primary/15" />
        </div>
      </div>
      <div className="animate-fade-up">
        <PantryView initialItems={items} />
      </div>
    </div>
  );
}
