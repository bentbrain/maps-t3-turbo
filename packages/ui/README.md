# @acme/ui

Shared UI component library for the Notion Locations monorepo.

## Overview

This package provides a collection of reusable React components built with [shadcn/ui](https://ui.shadcn.com/), a modern component library that uses Radix UI primitives and Tailwind CSS for styling.

## Components

The package exports the following components:

- **Badge** - Display status or category indicators
- **Button** - Interactive button with multiple variants
- **Card** - Container component for content sections
- **Collapsible** - Expandable/collapsible content areas
- **Command** - Command menu with search functionality
- **Dialog** - Modal dialog windows
- **Dropdown Menu** - Contextual menus
- **Emoji Picker** - Emoji selection component
- **Form** - Form components with react-hook-form integration
- **Input** - Text input fields
- **Label** - Form labels
- **Popover** - Floating content panels
- **Resizable** - Resizable panel layouts
- **Select** - Dropdown selection component
- **Separator** - Visual divider
- **Sheet** - Slide-out panels
- **Sidebar** - Navigation sidebar
- **Skeleton** - Loading state placeholders
- **Sonner** - Toast notifications
- **Switch** - Toggle switches
- **Table** - Data tables
- **Tabs** - Tabbed interfaces
- **Theme** - Theme provider and switcher
- **Toast** - Toast notifications
- **Tooltip** - Hover tooltips

## Usage

Import components directly from the package:

```tsx
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Save Location</CardTitle>
      </CardHeader>
      <CardContent>
        <Input placeholder="Location name" />
        <Button>Save to Notion</Button>
      </CardContent>
    </Card>
  );
}
```

## Styling

The components use Tailwind CSS for styling. Make sure to import the global styles in your app:

```tsx
import "@acme/ui/styles.css";
```

## Adding New Components

To add new shadcn/ui components to this package:

```bash
pnpm ui-add
```

This will run the shadcn/ui CLI to help you add new components interactively.

## Development

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format
```

## Dependencies

- **Radix UI** - Unstyled, accessible component primitives
- **Tailwind CSS** - Utility-first CSS framework
- **class-variance-authority** - Component variant management
- **tailwind-merge** - Tailwind class merging utility
- **React Hook Form** - Form state management
- **Zod** - Schema validation
