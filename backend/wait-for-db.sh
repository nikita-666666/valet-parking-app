#!/bin/bash

# Максимальное время ожидания в секундах
MAX_TRIES=60
WAIT_SECONDS=1

echo "Waiting for database to be ready..."
count=0

while ! nc -z db 3306; do
    echo "Database is unavailable - sleeping"
    sleep $WAIT_SECONDS
    count=$((count+1))
    
    if [ $count -gt $MAX_TRIES ]; then
        echo "Database connection timed out!"
        exit 1
    fi
done

echo "Database is up - executing command"
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
