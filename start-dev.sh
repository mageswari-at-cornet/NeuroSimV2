#!/bin/bash
# Script to cleanly start NeuroSim development servers

echo "🧹 Cleaning up old processes..."
pkill -f "tsx watch" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2

echo "🔍 Checking ports..."
if lsof -i :3001 >/dev/null 2>&1; then
    echo "⚠️  Port 3001 still in use, killing..."
    lsof -ti :3001 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

if lsof -i :5173 >/dev/null 2>&1; then
    echo "⚠️  Port 5173 still in use, killing..."
    lsof -ti :5173 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

echo "✅ Ports cleared!"
echo ""
echo "🚀 Starting NeuroSim..."
echo "   Frontend will be on: http://localhost:5173"
echo "   API will be on: http://localhost:3001"
echo ""

pnpm dev
