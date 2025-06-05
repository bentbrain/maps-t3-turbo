# @acme/validators

Shared validation schemas for the Notion Locations monorepo.

## Overview

This package contains all the Zod schemas used across the monorepo for runtime validation and TypeScript type inference. It ensures consistent data validation between the browser extension, web app, and API.

## Schemas

### Location Schemas

#### `newPlaceSchema`
Validates data when creating a new location:

```typescript
import { newPlaceSchema } from "@acme/validators/new-place-schema";

const validatedData = newPlaceSchema.parse({
  name: "Central Park",
  address: "New York, NY 10024",
  latitude: 40.785091,
  longitude: -73.968285,
  category: "park",
  notes: "Great for morning runs",
  rating: 5,
  googleMapsUrl: "https://maps.google.com/...",
});
```

### Common Schemas

The package also exports common validation schemas:

```typescript
// Coordinate validation
export const coordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// Category enum
export const categorySchema = z.enum([
  "restaurant",
  "cafe",
  "park",
  "museum",
  "shopping",
  "entertainment",
  "other",
]);

// Rating validation
export const ratingSchema = z.number().min(1).max(5).optional();
```

## Usage

### Basic Validation

```typescript
import { newPlaceSchema } from "@acme/validators/new-place-schema";

// Parse and validate
try {
  const location = newPlaceSchema.parse(unknownData);
  // location is now fully typed
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Validation errors:", error.errors);
  }
}

// Safe parse (doesn't throw)
const result = newPlaceSchema.safeParse(unknownData);
if (result.success) {
  // Use result.data
} else {
  // Handle result.error
}
```

### Type Inference

```typescript
import type { z } from "zod";
import { newPlaceSchema } from "@acme/validators/new-place-schema";

// Infer TypeScript type from schema
type NewPlace = z.infer<typeof newPlaceSchema>;

// Use the type
function saveLocation(place: NewPlace) {
  // TypeScript knows all the properties of place
}
```

### Form Integration

With react-hook-form and @hookform/resolvers:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { newPlaceSchema } from "@acme/validators/new-place-schema";

function LocationForm() {
  const form = useForm({
    resolver: zodResolver(newPlaceSchema),
  });

  // Form is now fully typed with validation
}
```

## Best Practices

1. **Keep schemas DRY** - Reuse common schemas and compose them
2. **Export types** - Always export inferred TypeScript types
3. **Descriptive errors** - Add custom error messages for better UX
4. **Version carefully** - Schema changes can break compatibility

## Adding New Schemas

1. Create a new file in `src/`
2. Define the schema using Zod
3. Export the schema and its inferred type
4. Update the main index to re-export
5. Add documentation

Example:
```typescript
// src/user-settings-schema.ts
import { z } from "zod";

export const userSettingsSchema = z.object({
  defaultDatabase: z.string().uuid().optional(),
  defaultCategory: categorySchema.optional(),
  autoSave: z.boolean().default(false),
});

export type UserSettings = z.infer<typeof userSettingsSchema>;
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

## Dependencies

- **zod** - TypeScript-first schema validation library