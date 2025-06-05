# @acme/api

tRPC API package for the Notion Locations monorepo.

## Overview

This package provides the tRPC router definitions and procedures that power the API for both the browser extension and web application. It handles all communication with Notion's API and manages location data.

## Architecture

The API is built with:

- **tRPC v11** - End-to-end typesafe APIs
- **Notion SDK** - Official Notion API client
- **Clerk** - Authentication middleware
- **Zod** - Runtime type validation

## Features

- 🔐 **Authenticated Procedures** - Secure API endpoints with Clerk authentication
- 📍 **Location Management** - CRUD operations for saved locations
- 📝 **Notion Integration** - Direct integration with Notion databases
- 🔍 **Search & Filtering** - Query locations with various filters
- ⚡ **Type Safety** - Full type inference from backend to frontend

## API Structure

```typescript
// Example router structure
export const appRouter = createTRPCRouter({
  location: locationRouter,
  notion: notionRouter,
  user: userRouter,
});
```

### Location Router

- `create` - Save a new location to Notion
- `list` - Get all user's saved locations
- `get` - Get a specific location by ID
- `update` - Update location details
- `delete` - Remove a location

### Notion Router

- `getDatabases` - List available Notion databases
- `getPage` - Fetch Notion page content
- `search` - Search across Notion workspace

### User Router

- `getProfile` - Get user profile and settings
- `updateSettings` - Update user preferences

## Usage

### In Next.js App

```typescript
import { api } from "@/trpc/client";

// In a React component
function LocationList() {
  const { data: locations } = api.location.list.useQuery();

  const createLocation = api.location.create.useMutation({
    onSuccess: () => {
      // Handle success
    },
  });

  return (
    // Your component JSX
  );
}
```

### In Browser Extension

```typescript
import { createTRPCProxyClient } from "@trpc/client";

import type { AppRouter } from "@acme/api";

const client = createTRPCProxyClient<AppRouter>({
  links: [
    /* ... */
  ],
});

// Use the client
const locations = await client.location.list.query();
```

## Authentication

All procedures requiring user data are protected with Clerk authentication:

```typescript
const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

## Error Handling

The API uses tRPC's built-in error handling with custom error messages:

```typescript
throw new TRPCError({
  code: "NOT_FOUND",
  message: "Location not found",
});
```

## Development

```bash
# Build the package
pnpm build

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format
```

## Environment Variables

Required environment variables:

- `NOTION_API_KEY` - Notion integration token
- `CLERK_SECRET_KEY` - Clerk secret key for authentication

## Contributing

When adding new procedures:

1. Define the input schema using Zod
2. Implement the procedure logic
3. Add appropriate error handling
4. Update the router exports
5. Test with both Next.js app and extension
