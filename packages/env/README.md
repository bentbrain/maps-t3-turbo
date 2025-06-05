# @acme/env

Environment variable validation and type safety for the Notion Locations monorepo.

## Overview

This package provides centralized environment variable validation using [@t3-oss/env-nextjs](https://github.com/t3-oss/t3-env). It ensures that all required environment variables are present and correctly typed at build time and runtime.

## Features

- 🔒 **Type-safe** - Full TypeScript support for environment variables
- ✅ **Validation** - Runtime validation with Zod schemas
- 🚨 **Early errors** - Fail fast if required variables are missing
- 📦 **Centralized** - Single source of truth for all env vars
- 🔧 **Developer friendly** - Clear error messages and autocompletion

## Usage

### Import and Use

```typescript
import { env } from "@acme/env";

// Use environment variables with full type safety
const apiUrl = env.NEXT_PUBLIC_API_URL;
const notionKey = env.NOTION_API_KEY;

// TypeScript will error if you try to access non-existent vars
// const invalid = env.NON_EXISTENT_VAR; // ❌ Type error
```

### In Next.js

The env validation runs automatically during the Next.js build process. If any required variables are missing, the build will fail with clear error messages.

### In Other Packages

```typescript
import { env } from "@acme/env";

export function createNotionClient() {
  return new Client({
    auth: env.NOTION_API_KEY,
  });
}
```

## Environment Variables

### Public Variables (Client-side)

Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser:

- `NEXT_PUBLIC_APP_URL` - The web application URL
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog analytics key
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog host URL

### Server Variables

These are only available on the server:

- `NOTION_API_KEY` - Notion integration token
- `CLERK_SECRET_KEY` - Clerk secret key
- `DATABASE_URL` - Database connection string (if applicable)

### Extension Variables

Used by the browser extension build:

- `VITE_PUBLISHABLE_KEY` - Clerk publishable key for extension
- `VITE_CLERK_FRONTEND_API` - Clerk frontend API URL
- `VITE_CRX_ID` - Chrome extension ID
- `VITE_CRX_PUBLIC_KEY` - Chrome extension public key
- `VITE_PUBLIC_CLERK_SYNC_HOST` - Clerk sync host
- `VITE_WEBSITE_URL` - Website URL for extension
- `VITE_API_URL` - API URL for extension

## Configuration

The environment schema is defined in `src/env.ts`:

```typescript
export const env = createEnv({
  server: {
    NOTION_API_KEY: z.string().min(1),
    CLERK_SECRET_KEY: z.string().min(1),
    // Add more server variables
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    // Add more client variables
  },
  runtimeEnv: {
    // Map the actual environment variables
    NOTION_API_KEY: process.env.NOTION_API_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    // ... etc
  },
});
```

## Adding New Variables

1. Add the schema in the appropriate section (`server` or `client`)
2. Add the runtime mapping in `runtimeEnv`
3. Update this README
4. Add the variable to `.env.example`

Example:
```typescript
// In src/env.ts
export const env = createEnv({
  server: {
    // Existing vars...
    NEW_API_KEY: z.string().min(1),
  },
  runtimeEnv: {
    // Existing mappings...
    NEW_API_KEY: process.env.NEW_API_KEY,
  },
});
```

## Error Handling

If validation fails, you'll get clear error messages:

```
❌ Invalid environment variables:
  NOTION_API_KEY: Required
  NEXT_PUBLIC_APP_URL: Invalid url
```

## Best Practices

1. **Never commit `.env` files** - Use `.env.example` as a template
2. **Validate early** - Import env at the top of your app
3. **Use descriptive names** - Make variable purposes clear
4. **Document variables** - Keep `.env.example` and README updated
5. **Separate concerns** - Use `NEXT_PUBLIC_` prefix only for truly public vars

## Development

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format
```