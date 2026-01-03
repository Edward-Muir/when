#!/bin/bash

# Release script for When? Timeline Game
# Usage: ./scripts/release.sh [patch|minor|major]

set -e

# Default to auto-detect from commits if no argument provided
RELEASE_TYPE=${1:-""}

echo "🚀 Starting release process..."

# Ensure working directory is clean (except for generated files)
if [[ -n $(git status --porcelain | grep -v 'feed.xml\|version.ts\|CHANGELOG.md') ]]; then
  echo "❌ Error: Working directory has uncommitted changes"
  echo "   Please commit or stash changes before releasing"
  git status --short
  exit 1
fi

# Run the release
if [[ -n "$RELEASE_TYPE" ]]; then
  echo "📦 Bumping $RELEASE_TYPE version..."
  npm run release:$RELEASE_TYPE
else
  echo "📦 Auto-detecting version bump from commits..."
  npm run release
fi

# Push with tags
echo "📤 Pushing to remote with tags..."
git push --follow-tags

echo "✅ Release complete!"
echo ""
echo "View the release at: https://github.com/Edward-Muir/when/releases"