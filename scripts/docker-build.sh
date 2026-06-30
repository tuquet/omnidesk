#!/bin/bash
set -e

# Default values if not provided
APP_NAME=${APP_NAME:-"omni-studio"}
APP_TYPE=${APP_TYPE:-"tauri"} # tauri, web, or extension

echo "========================================================"
echo "Starting Docker Build for $APP_NAME (Type: $APP_TYPE)"
echo "========================================================"

cd /app

export CI=true
# Limit node memory just in case
export NODE_OPTIONS="--max-old-space-size=4096"

echo "Installing dependencies via pnpm..."
# Use low concurrency to prevent OOM when falling back to file copying (due to cross-volume hardlink limitations)
pnpm install --frozen-lockfile=false --child-concurrency 1 --network-concurrency 1 --reporter=append-only

if [ "$APP_TYPE" = "tauri" ]; then
    echo "Building Tauri App ($APP_NAME) for Windows (x86_64-pc-windows-gnu)..."
    pnpm --filter "@omnidesk/$APP_NAME" tauri build --target x86_64-pc-windows-gnu
    
    if [ $? -eq 0 ]; then
        echo "Build successful. Copying artifacts to dist/$APP_NAME..."
        mkdir -p /app/dist/$APP_NAME
        find /app/apps/$APP_NAME/src-tauri/target/x86_64-pc-windows-gnu/release/bundle/nsis -name "*.exe" -exec cp {} /app/dist/$APP_NAME/ \;
        cp /app/apps/$APP_NAME/src-tauri/target/x86_64-pc-windows-gnu/release/$APP_NAME.exe /app/dist/$APP_NAME/ || true
        echo "Done! Artifacts saved in dist/$APP_NAME."
    else
        echo "Tauri Build Failed!"
        exit 1
    fi

elif [ "$APP_TYPE" = "web" ]; then
    echo "Building Web App ($APP_NAME)..."
    pnpm --filter "@omnidesk/$APP_NAME" build
    if [ $? -eq 0 ]; then
        mkdir -p /app/dist/$APP_NAME
        cp -r /app/apps/$APP_NAME/dist/* /app/dist/$APP_NAME/
        echo "Done! Artifacts saved in dist/$APP_NAME."
    else
        exit 1
    fi

elif [ "$APP_TYPE" = "extension" ]; then
    echo "Building Browser Extension ($APP_NAME)..."
    pnpm --filter "@omnidesk/$APP_NAME" build
    if [ $? -eq 0 ]; then
        mkdir -p /app/dist/$APP_NAME
        if [ -d "/app/apps/$APP_NAME/dist" ]; then
            cp -r /app/apps/$APP_NAME/dist/* /app/dist/$APP_NAME/
        elif [ -d "/app/apps/$APP_NAME/build" ]; then
            cp -r /app/apps/$APP_NAME/build/* /app/dist/$APP_NAME/
        fi
        echo "Done! Artifacts saved in dist/$APP_NAME."
    else
        exit 1
    fi
else
    echo "Unknown APP_TYPE: $APP_TYPE."
    exit 1
fi
