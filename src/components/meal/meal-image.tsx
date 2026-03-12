"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export function MealImage({ mealId, initialImageUrl }: { mealId: string; initialImageUrl: string | null }) {
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (imageUrl || loading || error) return;

    setLoading(true);
    fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mealId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.imageUrl) {
          setImageUrl(data.imageUrl);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [mealId, imageUrl, loading, error]);

  if (error) return null; // Silently fail — image is optional

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl bg-muted/50 h-48 w-full">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-xs">Generating image...</span>
        </div>
      </div>
    );
  }

  if (!imageUrl) return null;

  return (
    <div className="relative rounded-xl overflow-hidden">
      <img
        src={imageUrl}
        alt="AI generated meal photo"
        className="w-full h-48 object-cover rounded-xl"
      />
      <span className="absolute bottom-2 right-2 text-[10px] bg-black/50 text-white/80 px-1.5 py-0.5 rounded-full">
        AI generated
      </span>
    </div>
  );
}
