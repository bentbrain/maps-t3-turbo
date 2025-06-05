# Notion Locations

A monorepo containing a Chrome/Firefox extension and web application that allows you to save locations from Google Maps directly to your Notion databases.

## Overview

This project consists of:
- **Browser Extension**: Seamlessly save locations from Google Maps to Notion with a single click
- **Web Application**: View, manage, and visualize your saved locations on an interactive map

## Tech Stack

- **Monorepo**: [Turborepo](https://turbo.build/repo) with [pnpm workspaces](https://pnpm.io/workspaces)
- **Extension**: React + TypeScript + Vite + Tailwind CSS
- **Web App**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **API**: tRPC v11 for type-safe API communication
- **Authentication**: [Clerk](https://clerk.com)
- **Database Integration**: [Notion API](https://developers.notion.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)

## Project Structure

```text
.github
  └─ workflows
        └─ CI/CD workflows including extension build & release
apps
  ├─ extension
  |   ├─ Chrome/Firefox extension with manifest v3
  |   ├─ Content script for Google Maps integration
  |   ├─ Popup interface for quick saves
  |   └─ Options page for configuration
  └─ nextjs
      ├─ Next.js 15 web application
      ├─ Interactive map visualization using Google Maps
      ├─ Notion content rendering
      └─ Location management dashboard
packages
  ├─ api
  |   └─ tRPC API with Notion integration
  ├─ env
  |   └─ Shared environment variable validation
  ├─ ui
  |   └─ Shared UI component library (shadcn/ui)
  └─ validators
      └─ Shared Zod schemas for data validation
tooling
  ├─ eslint
  |   └─ Shared ESLint configurations
  ├─ github
  |   └─ GitHub Actions setup
  ├─ prettier
  |   └─ Shared Prettier configuration
  ├─ tailwind
  |   └─ Shared Tailwind CSS configuration
  └─ typescript
      └─ Shared TypeScript configurations
```

## Quick Start

### Prerequisites

- Node.js >= 22.14.0
- pnpm >= 9.6.0
- A [Notion](https://notion.so) account with API access
- A [Clerk](https://clerk.com) account for authentication
- Google Maps API key (for the web app)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd notion-locations
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
- `VITE_PUBLISHABLE_KEY` - Clerk publishable key
- `VITE_CLERK_FRONTEND_API` - Clerk frontend API URL
- `VITE_CRX_ID` - Chrome extension ID
- `VITE_CRX_PUBLIC_KEY` - Chrome extension public key
- `VITE_PUBLIC_CLERK_SYNC_HOST` - Clerk sync host URL
- `VITE_WEBSITE_URL` - Your web app URL
- `VITE_API_URL` - Your API URL
- `NOTION_API_KEY` - Your Notion integration API key
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key

### Development

Run all apps in development mode:
```bash
pnpm dev
```

Run specific apps:
```bash
# Extension only
pnpm dev --filter=@acme/extension

# Web app only
pnpm dev:next
```

### Building

Build all apps:
```bash
pnpm build
```

Build extension for Chrome:
```bash
pnpm build:chrome
```

## Extension Installation

### Development Build

1. Build the extension:
```bash
pnpm build:chrome
```

2. Load in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `apps/extension/dist_chrome` folder

3. Load in Firefox:
   - Navigate to `about:debugging`
   - Click "This Firefox"
   - Click "Load Temporary Add-on"
   - Select any file in `apps/extension/dist_firefox`

### Production Release

The extension is automatically built and attached to GitHub releases via the CI/CD workflow. See `.github/workflows/extension-upload-on-release.yml` for details.

## Contributing

Please read our contributing guidelines before submitting PRs.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
