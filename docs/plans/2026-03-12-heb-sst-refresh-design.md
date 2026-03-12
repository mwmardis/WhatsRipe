# HEB SST-Based SAT Auto-Refresh

## Problem

The HEB SAT (Session Access Token) expires every 30 minutes, requiring the user to manually paste a new token from browser DevTools each time they want to export a grocery list.

## Discovery

HEB's auth flow uses two cookies:
- **SST** (`sst`): Short opaque token (format `hs:sst:xxxxx`), 1-year browser cookie expiry, acts as a refresh token
- **SAT** (`sat`): JWT with 30-minute expiry, used for API authentication

When both `sst` and `sat` cookies are sent together (even with an expired SAT), HEB's server returns a fresh SAT and rotated SST in `Set-Cookie` response headers. The `sst.sig` cookie is not required for this exchange.

## Design

### Approach: Transparent token refresh in `hebGraphQL()`

Modify the existing HEB client to send both SST and SAT cookies on every request, parse refreshed tokens from response headers, and persist them back to the database.

### Database Changes

Add `hebSstToken` (nullable String) to `HouseholdProfile` schema. Existing `hebSessionToken` continues to store the SAT.

### Settings UI Changes

Replace single "HEB Session Token" input with two fields:
- **HEB SST Token** (`sst` cookie value) - set once, lasts ~1 year
- **HEB SAT Token** (`sat` cookie value) - optional after first setup, auto-maintained

### `hebGraphQL()` Changes

1. Accept `sstToken` in `HebConfig` alongside `sessionToken`
2. Send cookies: `sst={sstToken}; sat={sessionToken}`
3. Parse `Set-Cookie` response headers for refreshed `sst` and `sat` values
4. Return refreshed tokens alongside response data

### Export Route Changes

After `hebGraphQL()` calls, persist any refreshed `hebSstToken` and `hebSessionToken` values back to the household record.

### Error Handling

If SST-based refresh fails (token expired after ~1 year of disuse), existing "session expired" error message prompts user to update tokens in settings. No change to error flows.
