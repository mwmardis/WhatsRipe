"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowLeftRight, Search } from "lucide-react";
import { ProductSearchPopover } from "@/components/groceries/product-search-popover";
import {
  deleteProductMapping,
  createOrUpdateProductMapping,
} from "@/app/actions/product-mapping-actions";

interface ProductMappingData {
  id: string;
  genericName: string;
  hebProductId: string;
  hebProductName: string;
  hebBrand: string | null;
  hebPrice: number | null;
  hebSize: string | null;
  hebImageUrl: string | null;
}

export function ProductDefaultsSection({
  mappings: initialMappings,
}: {
  mappings: ProductMappingData[];
}) {
  const [filter, setFilter] = useState("");
  const [deleting, startDeleteTransition] = useTransition();

  const filtered = initialMappings.filter(
    (m) =>
      m.genericName.toLowerCase().includes(filter.toLowerCase()) ||
      m.hebProductName.toLowerCase().includes(filter.toLowerCase())
  );

  if (initialMappings.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          HEB Product Defaults
        </h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          No product defaults saved yet. Link products from your grocery list
          and they&apos;ll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card">
      <div className="p-5 pb-3">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          HEB Product Defaults
        </h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Manage your saved product mappings. These auto-apply when grocery lists
          are generated.
        </p>
      </div>

      {initialMappings.length > 5 && (
        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter mappings..."
              className="pl-9 rounded-lg"
            />
          </div>
        </div>
      )}

      <div className="divide-y divide-border/40 border-t border-border/40">
        {filtered.map((mapping) => (
          <div key={mapping.id} className="flex items-center gap-3 px-5 py-3">
            {mapping.hebImageUrl ? (
              <img
                src={mapping.hebImageUrl}
                alt=""
                className="size-10 rounded object-cover shrink-0 bg-muted"
              />
            ) : (
              <div className="size-10 rounded bg-muted shrink-0" />
            )}

            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-muted-foreground">
                  {mapping.genericName}
                </span>
                <span className="text-muted-foreground/50">&rarr;</span>
                <span className="font-medium truncate">
                  {mapping.hebProductName}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {mapping.hebBrand && <span>{mapping.hebBrand}</span>}
                {mapping.hebSize && <span>{mapping.hebSize}</span>}
                {mapping.hebPrice != null && (
                  <span className="font-semibold text-primary">
                    ${mapping.hebPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <ProductSearchPopover
                trigger={
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ArrowLeftRight className="size-3.5" />
                  </Button>
                }
                onSelect={async (product) => {
                  await createOrUpdateProductMapping({
                    genericName: mapping.genericName,
                    hebProductId: product.productId,
                    hebProductName: product.name,
                    hebBrand: product.brand,
                    hebPrice: product.price,
                    hebSize: product.size,
                    hebImageUrl: product.imageUrl,
                  });
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                disabled={deleting}
                onClick={() => {
                  startDeleteTransition(async () => {
                    await deleteProductMapping(mapping.id);
                  });
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
