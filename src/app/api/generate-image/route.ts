import { NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { mealId } = await request.json();

    if (!mealId) {
      return NextResponse.json({ error: "mealId is required" }, { status: 400 });
    }

    // Check if image already exists
    const meal = await db.meal.findUnique({
      where: { id: mealId },
      select: { id: true, name: true, description: true, imageUrl: true },
    });

    if (!meal) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }

    if (meal.imageUrl) {
      return NextResponse.json({ imageUrl: meal.imageUrl });
    }

    // Generate image using Gemini's image generation
    const model = google("gemini-3.1-flash-image-preview");

    const { files } = await generateText({
      model,
      providerOptions: {
        google: { responseModalities: ["TEXT", "IMAGE"] },
      },
      prompt: `Generate an appetizing overhead food photography image of this dish: "${meal.name}" - ${meal.description}. Natural lighting, rustic wooden table, family-style plating. No text, labels, or watermarks.`,
    });

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No image generated" },
        { status: 500 }
      );
    }

    const imageFile = files[0];
    const imageUrl = `data:${imageFile.mediaType};base64,${imageFile.base64}`;

    // Cache in database
    await db.meal.update({
      where: { id: mealId },
      data: { imageUrl },
    });

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Image generation failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to generate image", details: message },
      { status: 500 }
    );
  }
}
