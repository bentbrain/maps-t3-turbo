# Notion Locations Browser Extension

A Chrome/Firefox extension that allows you to save locations from Google Maps directly to your Notion databases.

## Features

- 🗺️ **One-click save**: Save any location from Google Maps to Notion with a single click
- 📝 **Custom properties**: Add notes, categories, and ratings to your saved locations
- 🔐 **Secure authentication**: Uses Clerk for secure authentication and sync with the web app
- 🎨 **Modern UI**: Built with React, TypeScript, and Tailwind CSS
- 🌐 **Cross-browser**: Works on both Chrome and Firefox with manifest v3

## Architecture

The extension consists of:

- **Content Script**: Injected into Google Maps pages to detect and extract location information
- **Background Service Worker**: Handles API communication and authentication
- **Popup**: Quick interface for saving the current location with additional details
- **Options Page**: Configure your Notion integration and preferences

## Development

### Prerequisites

- Node.js >= 22.14.0
- pnpm >= 9.6.0
- Chrome or Firefox browser

### Setup

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables in the root `.env` file:
```bash
VITE_PUBLISHABLE_KEY=your-clerk-publishable-key
VITE_CLERK_FRONTEND_API=your-clerk-frontend-api
VITE_CRX_ID=your-extension-id
VITE_CRX_PUBLIC_KEY=your-extension-public-key
VITE_PUBLIC_CLERK_SYNC_HOST=your-clerk-sync-host
VITE_WEBSITE_URL=your-website-url
VITE_API_URL=your-api-url
```

### Development Commands

```bash
# Run in development mode (Chrome)
pnpm dev
# or
pnpm dev:chrome

# Run in development mode (Firefox)
pnpm dev:firefox

# Build for production (Chrome)
pnpm build
# or
pnpm build:chrome

# Build for production (Firefox)
pnpm build:firefox

# Type checking
pnpm check-types
```

### Loading the Extension

#### Chrome
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist_chrome` folder

#### Firefox
1. Navigate to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select any file in the `dist_firefox` folder

## Project Structure

```
apps/extension/
├── public/              # Static assets (icons, etc.)
├── src/
│   ├── pages/
│   │   ├── background/  # Service worker
│   │   ├── content/     # Content script for Google Maps
│   │   ├── options/     # Options page
│   │   └── popup/       # Extension popup
│   ├── utils/           # Shared utilities
│   └── lib/             # API and authentication logic
├── manifest.json        # Extension manifest
├── vite.config.*.ts     # Vite configurations
└── package.json
```

## Key Technologies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool with CRXJS plugin
- **Tailwind CSS** - Styling
- **Clerk** - Authentication
- **Notion API** - Database integration
- **Chrome Extensions Manifest V3** - Extension platform

## Permissions

The extension requires the following permissions:

- `activeTab` - Access current tab information
- `tabs` - Navigate and interact with tabs
- `storage` - Store user preferences
- `cookies` - Authentication state management

Host permissions:
- `*://*.google.com/maps/*` - Interact with Google Maps
- `https://api.notion.com/*` - Save to Notion
- Clerk authentication endpoints

## Building for Production

Production builds are handled by the GitHub Actions workflow. When a release is created, the extension is automatically built and attached to the release.

Manual production build:
```bash
# Build for Chrome
pnpm build:chrome

# The built extension will be in dist_chrome/
# Create a zip for distribution:
cd dist_chrome && zip -r ../notion-locations-chrome.zip .
```

## Contributing

See the main repository README for contribution guidelines.
