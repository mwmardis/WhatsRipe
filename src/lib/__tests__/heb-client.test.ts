import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseSetCookies, searchHebProducts } from "../heb-client";

describe("parseSetCookies", () => {
  it("extracts sst and sat values from Set-Cookie headers", () => {
    const headers = [
      "sst=hs:sst:abc123; path=/; expires=Sat, 13 Mar 2027 03:47:17 GMT; httponly",
      "sst.sig=xyz789; path=/; expires=Sat, 13 Mar 2027 03:47:17 GMT; httponly",
      "sat=eyJhbGciOiJSUzI.payload.sig; path=/; expires=Thu, 12 Mar 2026 22:17:17 GMT; httponly",
      "other=value; path=/",
    ];

    const result = parseSetCookies(headers);
    expect(result.sst).toBe("hs:sst:abc123");
    expect(result.sat).toBe("eyJhbGciOiJSUzI.payload.sig");
  });

  it("returns undefined for missing cookies", () => {
    const headers = ["other=value; path=/"];
    const result = parseSetCookies(headers);
    expect(result.sst).toBeUndefined();
    expect(result.sat).toBeUndefined();
  });
});

describe("searchHebProducts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed product results from HEB search page", async () => {
    const mockNextData = {
      props: {
        pageProps: {
          layout: {
            visualComponents: [{
              type: "searchGridV2",
              items: [
                {
                  __typename: "Product",
                  id: "1767797",
                  displayName: "H-E-B Natural Boneless Chicken Breasts",
                  brand: { name: "H-E-B" },
                  productImageUrls: [
                    { url: "https://images.heb.com/prd-medium/001767797.jpg", size: "MEDIUM" },
                  ],
                  SKUs: [{
                    customerFriendlySize: "Avg. 2.85 lbs",
                    contextPrices: [{
                      context: "ONLINE",
                      listPrice: { amount: 14.22 },
                    }]
                  }]
                },
                {
                  __typename: "SponsoredBanner",
                  id: "banner-1"
                }
              ]
            }]
          }
        }
      }
    };

    const html = `<html><head></head><body><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(mockNextData)}</script></body></html>`;

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => html,
      headers: { get: () => "text/html", getSetCookie: () => [] },
    } as unknown as Response);

    const results = await searchHebProducts(
      { sessionToken: "test-sat", storeId: "727" },
      "chicken breast"
    );

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      productId: "1767797",
      name: "H-E-B Natural Boneless Chicken Breasts",
      brand: "H-E-B",
      price: 14.22,
      size: "Avg. 2.85 lbs",
      imageUrl: "https://images.heb.com/prd-medium/001767797.jpg",
    });
  });

  it("filters out non-Product items like SponsoredBanner", async () => {
    const mockNextData = {
      props: { pageProps: { layout: { visualComponents: [{
        type: "searchGridV2",
        items: [
          { __typename: "SponsoredBanner", id: "banner" },
          { __typename: "Product", id: "123", displayName: "Milk", brand: { name: "HEB" }, productImageUrls: [], SKUs: [{ customerFriendlySize: "1 gal", contextPrices: [{ context: "ONLINE", listPrice: { amount: 3.99 } }] }] },
        ]
      }]}}}
    };
    const html = `<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(mockNextData)}</script></html>`;
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true, status: 200, text: async () => html,
      headers: { get: () => "text/html", getSetCookie: () => [] },
    } as unknown as Response);

    const results = await searchHebProducts({ sessionToken: "t", storeId: "727" }, "milk");
    expect(results).toHaveLength(1);
    expect(results[0].productId).toBe("123");
  });

  it("throws on expired session (non-200 response)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false, status: 403,
      headers: { get: () => null, getSetCookie: () => [] },
    } as unknown as Response);

    await expect(
      searchHebProducts({ sessionToken: "expired", storeId: "727" }, "milk")
    ).rejects.toThrow();
  });

  it("returns empty array when no searchGridV2 found", async () => {
    const mockNextData = { props: { pageProps: { layout: { visualComponents: [] }}}};
    const html = `<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(mockNextData)}</script></html>`;
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true, status: 200, text: async () => html,
      headers: { get: () => "text/html", getSetCookie: () => [] },
    } as unknown as Response);

    const results = await searchHebProducts({ sessionToken: "t", storeId: "727" }, "xyz");
    expect(results).toEqual([]);
  });
});
