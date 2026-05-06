#!/bin/sh
set -e

if ! docker info > /dev/null 2>&1; then
  echo "Starting Docker Desktop..."
  open -a Docker
  until docker info > /dev/null 2>&1; do
    sleep 2
  done
  echo "Docker ready."
fi

docker compose --profile dev up -d --build
clear
docker compose --profile dev logs -f --no-log-prefix server
