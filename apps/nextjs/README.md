# Notion Locations Web Application

A Next.js web application for viewing and managing locations saved from Google Maps to Notion.

## Features

- 🗺️ **Interactive Map**: View all your saved locations on an interactive Google Maps interface
- 📍 **Location Management**: Browse, search, and organize your saved places
- 📝 **Notion Integration**: Seamlessly syncs with your Notion databases
- 🔍 **Advanced Search**: Search locations by name, category, or notes using fuzzy search
- 🎨 **Beautiful UI**: Modern, responsive design with dark mode support
- 🔐 **Secure Authentication**: Powered by Clerk for secure user management

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: Clerk
- **API**: tRPC for type-safe API routes
- **Maps**: Google Maps API via @vis.gl/react-google-maps
- **Notion Rendering**: react-notion-x for rich content display
- **State Management**: Zustand
- **Analytics**: PostHog

## Development

### Prerequisites

- Node.js >= 22.14.0
- pnpm >= 9.6.0
- Google Maps API key
- Clerk account
- Notion API access

### Setup

1. Install dependencies from the root directory:

```bash
pnpm install
```

2. Configure environment variables in the root `.env` file:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Notion
NOTION_API_KEY=your-notion-api-key

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
VITE_API_URL=http://localhost:3000

# PostHog (optional)
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### Development Commands

```bash
# Run from the root directory
pnpm dev:next

# Or run from this directory
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format
```

## Project Structure

```
apps/nextjs/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and configurations
│   ├── styles/          # Global styles
│   └── trpc/            # tRPC client configuration
├── public/              # Static assets
├── next.config.js       # Next.js configuration
├── tailwind.config.ts   # Tailwind CSS configuration
└── package.json
```

## Key Features Implementation

### Map Visualization

- Interactive Google Maps with custom markers
- Marker clustering for better performance with many locations
- Click markers to view location details

### Notion Integration

- Real-time sync with Notion databases
- Rich content rendering for location descriptions
- Support for various Notion block types

### Search and Filtering

- Fuzzy search across location names and descriptions
- Filter by categories or tags
- Sort by date added or alphabetically

### User Experience

- Responsive design works on desktop and mobile
- Dark mode support
- Fast page loads with Next.js optimization
- Progressive enhancement

## Environment Variables

| Variable                            | Description              | Required |
| ----------------------------------- | ------------------------ | -------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key         | Yes      |
| `CLERK_SECRET_KEY`                  | Clerk secret key         | Yes      |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`   | Google Maps API key      | Yes      |
| `NOTION_API_KEY`                    | Notion integration token | Yes      |
| `NEXT_PUBLIC_APP_URL`               | Application URL          | Yes      |
| `NEXT_PUBLIC_POSTHOG_KEY`           | PostHog project key      | No       |
| `NEXT_PUBLIC_POSTHOG_HOST`          | PostHog host URL         | No       |

## Deployment

This app is designed to be deployed on Vercel:

1. Push your code to GitHub
2. Import the repository in Vercel
3. Set the root directory to `apps/nextjs`
4. Configure environment variables
5. Deploy!

The app uses edge-compatible features and should work with Vercel's Edge Runtime for optimal performance.

## Contributing

See the main repository README for contribution guidelines.
