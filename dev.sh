#!/bin/bash

###############################################################################
# URL Shortener - Development Server
# Simple script to start backend and frontend for local development
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting URL Shortener Development Environment${NC}\n"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env with your configuration${NC}\n"
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Start backend
echo -e "${BLUE}📦 Starting backend server...${NC}"
cd backend
deno run --allow-net --allow-env --allow-read server.ts &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo -e "${BLUE}🎨 Starting frontend server...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo -e "\n${GREEN}✅ Development servers started!${NC}"
echo -e "${GREEN}   Backend:  http://localhost:${PORT:-8000}${NC}"
echo -e "${GREEN}   Frontend: http://localhost:5173${NC}"
echo -e "\n${YELLOW}Press Ctrl+C to stop all servers${NC}\n"

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo -e '\n${YELLOW}Servers stopped${NC}'" EXIT

# Wait for user interrupt
wait
