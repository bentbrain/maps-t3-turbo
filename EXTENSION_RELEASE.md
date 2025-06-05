# Chrome Extension Release Guide

This document explains how to build and release the Chrome extension with automatic update notifications.

## Overview

The extension release system includes:
- Automated GitHub Actions workflow for building and releasing
- Automatic release notes generation from commit messages
- In-extension update notifications for users
- Semantic versioning support

## Release Process

The extension uses **Google's release-please** for manual releases with excellent changelog generation. This provides:
- Manual control through GitHub UI
- Professional changelog generation from conventional commits
- Automatic version bumping based on commit analysis
- Streamlined release workflow

### Method 1: GitHub UI Manual Release (Recommended)

1. **Make your changes and commit using conventional format**:
   ```bash
   git add .
   git commit -m "feat(extension): add new location saving feature"
   git push origin main
   ```

2. **Trigger release manually through GitHub**:
   - Go to your repository's Actions tab
   - Click "Extension Release" workflow
   - Click "Run workflow" 
   - Choose release type (auto/patch/minor/major)
   - Click "Run workflow" button

3. **Release-please will**:
   - Analyze your commits since the last release
   - Generate professional changelog with proper grouping
   - Create the release and build the extension automatically

### Commit Types and Version Bumps

- `feat(extension):` → **Minor** version bump (1.4.0 → 1.5.0)
- `fix(extension):` → **Patch** version bump (1.4.0 → 1.4.1)  
- `feat(extension)!:` → **Major** version bump (1.4.0 → 2.0.0)
- `chore(extension):` → No version bump (maintenance)
- `docs(extension):` → No version bump (documentation)

### Method 2: Using the Helper Script

Run the helper script to see the current status and get guidance:
```bash
pnpm release:extension
```

This script will show you:
- Current extension version
- Git status
- Examples of proper commit messages
- Links to check for pending releases

### Method 3: Force Release

To create a release without functional changes:
```bash
git commit --allow-empty -m "chore(extension): release 1.4.0"
git push origin main
```

## Release Notes Generation

Release-please automatically generates professional release notes by:
1. Parsing conventional commits since the last release
2. Grouping changes by type (Features, Bug Fixes, etc.)
3. Creating properly formatted changelogs
4. Adding installation instructions via GitHub Actions

## Update Notifications

The extension includes an automatic update notification system:

### Features
- Checks for updates every 4 hours
- Shows a subtle, dismissible notification in the popup
- Users can view release details or dismiss the notification
- Dismissed notifications won't show again for that version

### Configuration

Update the GitHub repository in the update checker:

```typescript
// apps/extension/src/utils/update-checker.ts
const GITHUB_REPO = "your-username/your-repo-name"; // Update this!
```

### Permissions

The extension requires the following permission for update checking:
```json
"host_permissions": [
  "https://api.github.com/*"
]
```

## File Structure

```
.github/workflows/
├── extension-release.yml    # Main release workflow
├── ci.yml                  # Existing CI workflow

apps/extension/
├── src/
│   ├── utils/
│   │   └── update-checker.ts      # Update checking logic
│   └── components/
│       └── UpdateNotification.tsx # Update notification UI
├── manifest.json           # Updated with GitHub API permission
└── package.json           # Version gets updated here

scripts/
└── release-extension.sh    # Release helper script
```

## Troubleshooting

### Common Issues

1. **Permission denied on script**: Run `chmod +x scripts/release-extension.sh`

2. **GitHub API rate limiting**: The extension checks for updates every 4 hours to avoid rate limits

3. **Update notifications not showing**: 
   - Check browser console for errors
   - Verify the GitHub repository name is correct in `update-checker.ts`
   - Ensure the extension has the GitHub API permission

4. **Release workflow fails**:
   - Check that all required secrets are set in GitHub repository settings
   - Verify the tag format follows `extension-v*` pattern

### Required GitHub Secrets

Ensure these secrets are configured in your repository settings:
- `VITE_PUBLISHABLE_KEY`
- `VITE_CLERK_FRONTEND_API`
- `VITE_CRX_ID`
- `VITE_CRX_PUBLIC_KEY`
- `VITE_PUBLIC_CLERK_SYNC_HOST`
- `VITE_WEBSITE_URL`
- `VITE_API_URL`

## Best Practices

1. **Semantic Versioning**: Use semantic versioning (MAJOR.MINOR.PATCH)
2. **Descriptive Commits**: Write clear commit messages for better release notes
3. **Test Before Release**: Always test the extension locally before releasing
4. **Tag Naming**: Use the `extension-v` prefix for all extension releases
5. **Release Frequency**: Consider user experience when deciding release frequency

## Example Workflow

```bash
# 1. Make your changes and commit with conventional format
git add .
git commit -m "feat(extension): add new location saving feature"
git push origin main

# 2. Go to GitHub Actions and trigger release
# Actions tab → Extension Release → Run workflow → Choose "auto" → Run workflow

# 3. Release-please creates the release automatically
# Check GitHub Releases for the new version with changelog

# 4. Verify
# Download the extension zip and test
# Test the update notification in development
```

## Migrating from Manual Releases

If you have existing releases, release-please will:
1. Detect the last release automatically
2. Start generating releases from that point forward
3. Maintain your existing release history

The first release-please PR might include all changes since your last manual release.

This system ensures a smooth release process and keeps users informed about updates! 