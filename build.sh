#!/bin/bash

# mjpin Discord Bot - Production Build Script
# Creates a clean production build excluding development files

set -e  # Exit on any error

PROJECT_NAME="mjpin"
BUILD_DIR="build"
ARCHIVE_NAME="${PROJECT_NAME}-production.tar.gz"

echo "🤖 Building ${PROJECT_NAME} for production..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf ${BUILD_DIR}
rm -f ${ARCHIVE_NAME}

# Create build directory
echo "📁 Creating build directory..."
mkdir -p ${BUILD_DIR}/${PROJECT_NAME}

# Copy files excluding those in .buildignore
echo "📋 Copying production files..."
if [ -f .buildignore ]; then
    # Use rsync with exclude-from for clean copying
    rsync -av --exclude-from='.buildignore' . ${BUILD_DIR}/${PROJECT_NAME}/
else
    echo "⚠️  Warning: .buildignore not found, copying all files"
    cp -r . ${BUILD_DIR}/${PROJECT_NAME}/
fi

# Ensure essential files are present
echo "✅ Validating essential files..."
ESSENTIAL_FILES=(
    "src/index.js"
    "package.json"
    "ecosystem.config.js"
)

for file in "${ESSENTIAL_FILES[@]}"; do
    if [ ! -f "${BUILD_DIR}/${PROJECT_NAME}/${file}" ]; then
        echo "❌ Error: Essential file ${file} is missing from build!"
        exit 1
    fi
done

# Create production package.json if needed (remove dev dependencies)
echo "📦 Preparing production package.json..."
cd ${BUILD_DIR}/${PROJECT_NAME}

# Remove devDependencies from package.json (if any exist in future)
if command -v jq >/dev/null 2>&1; then
    # Use jq if available to clean package.json
    jq 'del(.devDependencies) | del(.scripts.test)' package.json > package.json.tmp
    mv package.json.tmp package.json
fi

cd ../..

# Create compressed archive
echo "🗜️  Creating production archive..."
cd ${BUILD_DIR}
tar -czf ../${ARCHIVE_NAME} ${PROJECT_NAME}/
cd ..

# Display build info
ARCHIVE_SIZE=$(du -h ${ARCHIVE_NAME} | cut -f1)
echo ""
echo "✨ Production build complete!"
echo "📦 Archive: ${ARCHIVE_NAME} (${ARCHIVE_SIZE})"
echo "📁 Build directory: ${BUILD_DIR}/${PROJECT_NAME}/"
echo ""
echo "🚀 Deployment instructions:"
echo "   1. Upload ${ARCHIVE_NAME} to your server"
echo "   2. Run the deploy.sh script on the server"
echo "   3. Or extract manually and preserve server data/"
echo ""
echo "⚠️  Remember: Server's data/ directory contains critical files!"
echo "   - pinterest_tokens.json"
echo "   - boards.json"
echo "   - pin_counts.json"
echo "   - model_settings.json"