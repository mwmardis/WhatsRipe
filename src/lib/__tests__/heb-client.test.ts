import { describe, it, expect } from "vitest";
import { parseSetCookies } from "../heb-client";

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
