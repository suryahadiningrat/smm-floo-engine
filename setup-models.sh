#!/bin/bash

# Script to setup Ollama models
# Usage: ./setup-models.sh

echo "Waiting for Ollama service to be ready..."
# Simple wait loop (requires curl, which might not be on the host, assuming user runs this on host)
# Or we can run this via docker exec

# Check if docker-compose is running
if [ -z "$(docker compose ps -q ollama)" ]; then
    echo "Ollama container is not running. Please run 'docker compose up -d' first."
    exit 1
fi

echo "Pulling Llama 3.2 (Text)..."
docker compose exec ollama ollama pull llama3.2

echo "Pulling Llama 3.2 Vision..."
docker compose exec ollama ollama pull llama3.2-vision

echo "All models pulled successfully!"
