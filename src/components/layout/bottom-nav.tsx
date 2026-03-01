"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ShoppingCart, Settings, ChevronUp, Package, Apple, ShieldCheck, ChefHat, BarChart3 } from "lucide-react";

const primaryNavItems = [
  { href: "/", label: "Plan", icon: CalendarDays },
  { href: "/groceries", label: "Groceries", icon: ShoppingCart },
  { href: "/settings", label: "Settings", icon: Settings },
];

const moreNavItems = [
  { href: "/pantry", label: "Pantry", icon: Package },
  { href: "/nutrition", label: "Nutrition", icon: BarChart3 },
  { href: "/allergen-tracker", label: "Allergens", icon: ShieldCheck },
  { href: "/prep", label: "Meal Prep", icon: ChefHat },
];

export function BottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = moreNavItems.some((item) => pathname.startsWith(item.href));

  return (
    <>
      {/* Expanded more menu */}
      {showMore && (
        <div className="fixed bottom-[4.5rem] left-0 right-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-xl">
          <div className="mx-auto max-w-lg grid grid-cols-4 gap-1 p-2">
            {moreNavItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setShowMore(false)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-medium transition-all duration-200 ${
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.5rem] max-w-lg items-center justify-around">
          {primaryNavItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-col items-center justify-center gap-1.5 px-5 py-2 text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? "text-primary scale-105"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive && (
                  <span className="absolute -top-0.5 h-0.5 w-6 rounded-full bg-primary" />
                )}
                <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span>{label}</span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`relative flex flex-col items-center justify-center gap-1.5 px-5 py-2 text-xs font-medium transition-all duration-200 ${
              isMoreActive || showMore
                ? "text-primary scale-105"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {(isMoreActive || showMore) && (
              <span className="absolute -top-0.5 h-0.5 w-6 rounded-full bg-primary" />
            )}
            <ChevronUp className={`h-5 w-5 transition-transform duration-200 ${showMore ? "rotate-180" : ""} ${isMoreActive || showMore ? "stroke-[2.5]" : ""}`} />
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
