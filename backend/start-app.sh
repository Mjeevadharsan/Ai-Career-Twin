#!/bin/bash

echo "========================================"
echo "  AI Career Twin - Application Starter"
echo "========================================"
echo ""

echo "[1/2] Starting Spring Boot Backend..."
echo "      Port: 5001"
echo "      URL: http://localhost:5001"
echo ""

# Start backend in background
gnome-terminal --title="Spring Boot Backend (Port 5001)" -- bash -c "mvn spring-boot:run; exec bash" 2>/dev/null || \
xterm -title "Spring Boot Backend (Port 5001)" -e "mvn spring-boot:run" 2>/dev/null || \
echo "Backend starting in current terminal. Open new terminal for frontend."

echo "Waiting 10 seconds for backend to initialize..."
sleep 10
echo ""

echo "[2/2] Starting React Frontend..."
echo "      Port: 3000"
echo "      URL: http://localhost:3000"
echo ""

# Start frontend in background
gnome-terminal --title="React Frontend (Port 3000)" -- bash -c "cd frontend && npm run dev; exec bash" 2>/dev/null || \
xterm -title "React Frontend (Port 3000)" -e "cd frontend && npm run dev" 2>/dev/null || \
(cd frontend && npm run dev)

echo ""
echo "========================================"
echo "  Both servers are starting!"
echo "========================================"
echo ""
echo "Backend:  http://localhost:5001"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop this script"
echo "(Servers will continue in other terminals)"
echo ""

# Keep script running
wait
