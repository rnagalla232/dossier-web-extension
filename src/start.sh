#!/bin/bash

# Dossier Web App Launch Script
# This script starts a simple HTTP server for the bookmark manager

echo "🚀 Starting Dossier Bookmark Manager..."
echo ""
echo "📋 Pre-flight checklist:"
echo "   ✓ Make sure your backend is running at http://localhost:8000"
echo ""

# Check if backend is running
if curl -s http://localhost:8000/ > /dev/null 2>&1; then
    echo "   ✓ Backend is running!"
else
    echo "   ⚠️  Warning: Backend doesn't seem to be running at http://localhost:8000"
    echo "      Please start your backend first."
    echo ""
fi

echo ""
echo "Starting web server on http://localhost:3000..."
echo "Press Ctrl+C to stop the server"
echo ""
echo "================================================"
echo ""

# Start Python HTTP server
cd "$(dirname "$0")"
python3 -m http.server 3000

