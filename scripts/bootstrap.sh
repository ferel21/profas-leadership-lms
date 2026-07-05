#!/bin/bash
# Self-bootstrapping and monitoring script for PROFAS LMS
# Checks the health of the application and starts it if it is down.

PORT=3000
APP_DIR="/home/keyra/PROFAS LEADERSHIP LANDING PAGE"
LOG_FILE="$APP_DIR/bootstrap.log"

echo "[$(date)] Running health check..." >> "$LOG_FILE"

# Check if port 3000 is active
if lsof -i :$PORT > /dev/null 2>&1; then
    echo "[$(date)] Application is online and running on port $PORT." >> "$LOG_FILE"
else
    echo "[$(date)] Application is OFFLINE. Bootstrapping now..." >> "$LOG_FILE"
    cd "$APP_DIR"
    
    # Run in background using nohup to keep it running 24/7
    nohup npm run dev >> "$APP_DIR/dev-server.log" 2>&1 &
    
    # Wait a few seconds and verify
    sleep 5
    if lsof -i :$PORT > /dev/null 2>&1; then
        echo "[$(date)] Bootstrapping SUCCESS. Application is now online." >> "$LOG_FILE"
    else
        echo "[$(date)] Bootstrapping FAILED. Please check dev-server.log." >> "$LOG_FILE"
    fi
fi
