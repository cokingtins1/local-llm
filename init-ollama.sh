#!/bin/bash

# Wait for Ollama to be ready
echo "Waiting for Ollama to start..."
while ! curl -s http://ollama:11434/api/version > /dev/null; do
    sleep 2
done

echo "Ollama is ready! Pulling required models..."

# Pull the embedding model
echo "Pulling nomic-embed-text model for embeddings..."
ollama pull nomic-embed-text

# Pull the chat model
echo "Pulling gemma3:1b model for chat..."
ollama pull gemma3:1b

echo "All models downloaded successfully!"
echo "Available models:"
ollama list