import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateHousehold } from "@/app/settings/actions";

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeICS(text: string): string {
  return text.replace(/[\\;,\n]/g, (match) => {
    if (match === "\n") return "\\n";
    return `\\${match}`;
  });
}

export async function GET() {
  try {
    const household = await getOrCreateHousehold();

    const plan = await db.weeklyPlan.findFirst({
      where: { householdId: household.id },
      orderBy: { createdAt: "desc" },
      include: {
        dailyPlans: {
          orderBy: { dayOfWeek: "asc" },
          include: { meals: true },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "No meal plan found" }, { status: 404 });
    }

    const mealTimes: Record<string, { hour: number; minute: number }> = {
      breakfast: { hour: 8, minute: 0 },
      lunch: { hour: 12, minute: 0 },
      dinner: { hour: 18, minute: 0 },
    };

    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//WhatsRipe//Meal Plan//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:WhatsRipe Meal Plan",
    ];

    for (const dp of plan.dailyPlans) {
      const dayDate = new Date(plan.weekStart);
      dayDate.setDate(dayDate.getDate() + dp.dayOfWeek);

      for (const meal of dp.meals) {
        const time = mealTimes[meal.mealType] || { hour: 18, minute: 0 };
        const startDate = new Date(dayDate);
        startDate.setHours(time.hour, time.minute, 0, 0);
        const endDate = new Date(startDate);
        endDate.setHours(startDate.getHours() + 1);

        icsContent.push(
          "BEGIN:VEVENT",
          `DTSTART:${formatICSDate(startDate)}`,
          `DTEND:${formatICSDate(endDate)}`,
          `SUMMARY:${escapeICS(meal.name)} (${meal.mealType})`,
          `DESCRIPTION:${escapeICS(meal.description)}`,
          `UID:${meal.id}@whatsripe`,
          "END:VEVENT"
        );
      }
    }

    icsContent.push("END:VCALENDAR");

    return new NextResponse(icsContent.join("\r\n"), {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="whatsripe-meals.ics"',
      },
    });
  } catch (error) {
    console.error("Calendar export failed:", error);
    return NextResponse.json({ error: "Failed to export calendar" }, { status: 500 });
  }
}
