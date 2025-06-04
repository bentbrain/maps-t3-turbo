#!/bin/bash

# Extension Release Script
# This script creates a conventional commit that will trigger release-please
# Usage: ./scripts/release-extension.sh [commit-message]
# Examples: 
#   ./scripts/release-extension.sh "feat(extension): add new location saving feature"
#   ./scripts/release-extension.sh "fix(extension): resolve popup display issue"

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_status "Extension Release Helper Script"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps/extension" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

# Show current status
print_info "Current extension version: $(cd apps/extension && node -p "require('./package.json').version")"
print_info "Current git branch: $(git branch --show-current)"
echo ""

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Git working directory is not clean. Uncommitted changes:"
    git status --short
    echo ""
fi

# Explain the process
cat << 'EOF'
🚀 Release Process with release-please:

1. Make your changes and commit them using conventional commit format:
   - feat(extension): for new features (triggers minor version bump)
   - fix(extension): for bug fixes (triggers patch version bump)  
   - feat(extension)!: for breaking changes (triggers major version bump)
   - chore(extension): for maintenance tasks
   - docs(extension): for documentation changes

2. Push to main branch - this will trigger release-please to:
   - Analyze commits since last release
   - Determine next version automatically
   - Create/update a release PR with changelog
   
3. Merge the release PR to create the actual release:
   - GitHub Actions will build and attach the extension zip
   - Release notes will be auto-generated from commits
   - Users will get update notifications

EOF

echo ""
print_info "Example commit commands:"
echo "  git add ."
echo "  git commit -m \"feat(extension): add new location saving feature\""
echo "  git push origin main"
echo ""
print_info "To see pending release changes:"
echo "  Check for open release PRs: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/]*\)\.git/\1/')/pulls"
echo ""
print_info "To force a release without changes:"
echo "  git commit --allow-empty -m \"chore(extension): release $(cd apps/extension && node -p "require('./package.json').version")\""
echo "  git push origin main" 