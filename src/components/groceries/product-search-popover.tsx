"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, Search, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface HebProduct {
  productId: string;
  name: string;
  brand: string | null;
  price: number | null;
  size: string | null;
  imageUrl: string | null;
}

interface ProductSearchPopoverProps {
  trigger: React.ReactNode;
  onSelect: (product: HebProduct) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProductSearchPopover({
  trigger,
  onSelect,
  open,
  onOpenChange,
}: ProductSearchPopoverProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HebProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/heb-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: query.trim() }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Search failed");
          setResults([]);
        } else {
          setResults(data.products ?? []);
        }
      } catch {
        setError("Search failed");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSelect(product: HebProduct) {
    onSelect(product);
    setQuery("");
    setResults([]);
    onOpenChange?.(false);
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search HEB products..."
            className="border-0 p-0 h-8 focus-visible:ring-0 shadow-none"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
              }}
              className="shrink-0"
            >
              <X className="size-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <p className="px-3 py-4 text-sm text-destructive text-center">
              {error}
            </p>
          )}

          {!loading && !error && results.length === 0 && query.trim() && (
            <p className="px-3 py-4 text-sm text-muted-foreground text-center">
              No products found
            </p>
          )}

          {!loading &&
            results.map((product) => (
              <button
                key={product.productId}
                type="button"
                onClick={() => handleSelect(product)}
                className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0"
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="size-10 rounded object-cover shrink-0 bg-muted"
                  />
                ) : (
                  <div className="size-10 rounded bg-muted shrink-0" />
                )}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium leading-tight line-clamp-2">
                    {product.name}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {product.brand && <span>{product.brand}</span>}
                    {product.size && <span>{product.size}</span>}
                  </div>
                  {product.price != null && (
                    <span className="text-xs font-semibold text-primary">
                      ${product.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </button>
            ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
