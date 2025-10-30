#!/bin/bash

###############################################################################
# URL Shortener - Development Startup Script
#
# PURPOSE: Start both backend and frontend development servers concurrently
#
# USAGE:
#   ./start.sh              # Start both servers
#   ./start.sh backend      # Start backend only
#   ./start.sh frontend     # Start frontend only
#
# REQUIREMENTS:
#   - Deno 1.40 or higher installed
#   - Bash shell
#
# ARCHITECTURE:
#   - Runs processes in background
#   - Captures PIDs for cleanup
#   - Handles SIGINT (Ctrl+C) gracefully
#   - Kills all child processes on exit
###############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Store PIDs for cleanup
BACKEND_PID=""
FRONTEND_PID=""

###############################################################################
# CLEANUP FUNCTION
#
# PURPOSE: Kill all spawned processes on script exit
# CALLED: Automatically on EXIT signal
# WHY: Prevents orphaned processes after Ctrl+C
###############################################################################
cleanup() {
  echo -e "\n${YELLOW}Shutting down...${NC}"
  
  if [ ! -z "$BACKEND_PID" ]; then
    echo -e "${BLUE}Stopping backend (PID: $BACKEND_PID)...${NC}"
    kill $BACKEND_PID 2>/dev/null
  fi
  
  if [ ! -z "$FRONTEND_PID" ]; then
    echo -e "${BLUE}Stopping frontend (PID: $FRONTEND_PID)...${NC}"
    kill $FRONTEND_PID 2>/dev/null
  fi
  
  # Kill any remaining child processes
  # REASON: Deno might spawn additional processes
  pkill -P $$ 2>/dev/null
  
  echo -e "${GREEN}Cleanup complete. Goodbye!${NC}"
  exit 0
}

# Register cleanup function to run on script exit
# SIGNALS: EXIT (normal exit), INT (Ctrl+C), TERM (kill command)
trap cleanup EXIT INT TERM

###############################################################################
# CHECK DENO INSTALLATION
#
# PURPOSE: Verify Deno is installed before starting
# ERROR: Exit if Deno is not found
###############################################################################
check_deno() {
  if ! command -v deno &> /dev/null; then
    echo -e "${RED}Error: Deno is not installed${NC}"
    echo -e "${YELLOW}Please install Deno from: https://deno.land/manual/getting_started/installation${NC}"
    exit 1
  fi
  
  DENO_VERSION=$(deno --version | head -n 1)
  echo -e "${GREEN}✓ Found $DENO_VERSION${NC}"
}

###############################################################################
# START BACKEND SERVER
#
# PURPOSE: Start Deno backend in development mode
# OUTPUT: Redirected to backend.log (optional)
# WATCH MODE: Auto-restart on file changes
###############################################################################
start_backend() {
  echo -e "${BLUE}Starting backend server...${NC}"
  
  # Start backend in background
  # --watch: Auto-reload on file changes
  # --allow-net: Network permissions
  # --allow-env: Environment variable access
  deno task dev:backend &
  BACKEND_PID=$!
  
  echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
  echo -e "${GREEN}  URL: http://localhost:8000${NC}"
}

###############################################################################
# START FRONTEND SERVER
#
# PURPOSE: Start Vite development server
# OUTPUT: Live in terminal
# HMR: Hot Module Replacement enabled
###############################################################################
start_frontend() {
  echo -e "${BLUE}Starting frontend server...${NC}"
  
  # Wait a moment for backend to start
  # REASON: Frontend might make initial API calls
  sleep 2
  
  # Start frontend in background
  cd frontend && deno task dev &
  FRONTEND_PID=$!
  cd ..
  
  echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
  echo -e "${GREEN}  URL: http://localhost:5173${NC}"
}

###############################################################################
# MAIN SCRIPT EXECUTION
###############################################################################

# Print banner
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════╗"
echo "║   🔗 URL Shortener Dev Environment   ║"
echo "╔═══════════════════════════════════════╗"
echo -e "${NC}"

# Check Deno installation
check_deno

# Parse command line arguments
MODE="${1:-all}"

case $MODE in
  backend)
    echo -e "${YELLOW}Starting in BACKEND ONLY mode${NC}\n"
    start_backend
    ;;
  frontend)
    echo -e "${YELLOW}Starting in FRONTEND ONLY mode${NC}\n"
    start_frontend
    ;;
  all|*)
    echo -e "${YELLOW}Starting in FULL STACK mode${NC}\n"
    start_backend
    start_frontend
    ;;
esac

# Print status
echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Development servers are running!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"

if [ ! -z "$BACKEND_PID" ]; then
  echo -e "${BLUE}Backend:${NC}  http://localhost:8000"
  echo -e "${BLUE}Health:${NC}   http://localhost:8000/health"
fi

if [ ! -z "$FRONTEND_PID" ]; then
  echo -e "${BLUE}Frontend:${NC} http://localhost:5173"
fi

echo -e "\n${YELLOW}Press Ctrl+C to stop all servers${NC}\n"

# Wait for user interrupt
# IMPORTANT: Script stays alive to keep processes running
# Cleanup happens automatically via trap on exit
wait
