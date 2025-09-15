# Local RAG Application

A Retrieval-Augmented Generation (RAG) application that enables you to chat with your documents using local language models. The system combines document processing, vector embeddings, and conversational AI to provide context-aware responses based on your uploaded PDF documents.

## Architecture Overview

This is a **unified Next.js application** that handles both frontend and backend functionality:

### Single Application Stack
- **Framework**: Next.js 14 with TypeScript (frontend + API routes)
- **UI**: React with Tailwind CSS and shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM
- **Vector Storage**: pgvector extension for similarity search
- **LLM**: Local Ollama integration with Llama models
- **Document Processing**: LangChain for PDF processing and text splitting

## How RAG Works in This Application

### 1. Document Ingestion Pipeline
```
PDF Documents → Text Extraction → Text Chunking → Embeddings Generation → Vector Storage
```

**Process Flow:**
- PDFs are loaded from `public/assets/` directory using LangChain's `PDFLoader`
- Documents are split into manageable chunks (1000 characters with 200 character overlap)
- Each chunk gets a unique ID based on `source:page:chunk_index` format
- Text embeddings are generated using Ollama's `llama3.1` model
- Embeddings are stored in PostgreSQL with pgvector extension
- All processing happens via Next.js API routes (`/api/load`)

### 2. Query Processing Pipeline
```
User Query → Embedding Generation → Similarity Search → Context Retrieval → LLM Response
```

**Process Flow:**
- User submits a question through the web interface
- Next.js API route (`/api/chat`) processes the request
- Query is converted to embeddings using the same Ollama model
- Vector similarity search retrieves top 5 most relevant document chunks
- Retrieved context is combined with the user's question in a prompt template
- Ollama's `capybara` model generates a contextual response
- Response is streamed back to the frontend in real-time

## Project Structure

```
/local-llm/
├── app/                 # Next.js app directory
│   ├── actions/         # Server actions for RAG operations
│   ├── api/            # API routes for chat and document loading
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/          # React components
│   ├── custom/         # Custom application components
│   └── ui/             # shadcn/ui components
├── lib/                # Utilities and type definitions
├── prisma/             # Database schema and migrations
├── public/             # Static assets
│   └── assets/         # PDF documents for RAG processing
├── package.json        # Dependencies
├── docker-compose.yml  # Docker configuration (includes Ollama!)
├── init-ollama.sh      # Ollama model initialization script
├── Dockerfile          # Next.js container configuration
└── README.md           # This file
```

## Key Components

### Database Schema
```sql
model DocumentChunks {
  id       String   @id @default(uuid())
  chunkId  String?  -- Format: "filepath:page:chunk_index"
  content  String?  -- The actual text content
  metadata Json?    -- Document metadata (source, page, etc.)
  vector   vector?  -- Embedding vector for similarity search
}
```

### Core API Routes

- **`POST /api/chat`** - Handles user queries and returns streaming responses
- **`GET /api/load`** - Processes new PDFs and updates the vector database

### Core Functions

- **`updatePrismaDB()`** - Processes new PDFs and updates the vector database
- **`queryDB()`** - Performs similarity search and generates responses
- **`ollamaEmbeddings`** - Handles text-to-embedding conversion
- **`initializePrismaDB()`** - Sets up the Prisma vector store connection

## Features

- **Document Upload**: Automatic processing of PDF files from the assets directory
- **Smart Chunking**: Text is intelligently split while preserving context
- **Semantic Search**: Vector similarity search finds the most relevant content
- **Streaming Responses**: Real-time response generation with progress feedback
- **Duplicate Prevention**: Only new document chunks are processed and stored
- **Context-Aware Responses**: LLM responses are grounded in your document content

## Technology Stack

### Unified Dependencies
- **Next.js 14**: React framework with server-side rendering and API routes
- **Prisma**: Database ORM with pgvector support
- **LangChain**: Document processing and AI orchestration
- **Tailwind CSS**: Utility-first CSS framework
- **React Hook Form**: Form handling with Zod validation
- **pgvector**: PostgreSQL vector similarity search
- **Ollama**: Local LLM integration

## Setup and Installation

### Prerequisites
- Docker and Docker Compose
- Node.js and npm (for development only)

**Note**: Ollama and PostgreSQL are now included in the Docker setup - no separate installation required!

### Quick Start with Docker

#### Production Mode (Recommended for deployment)
```bash
# Start the entire application stack in production mode
docker-compose -f docker-compose.yml up -d

# This will start:
# - PostgreSQL database with pgvector (port 6024)
# - Ollama server with AI models (port 11434)  
# - Next.js application (port 3000) - optimized build

# Wait for models to download (first time only - may take 5-10 minutes)
# Check Ollama status:
curl http://localhost:11434/api/version

# Pull required models (if not auto-downloaded):
docker exec ollama_container ollama pull nomic-embed-text
docker exec ollama_container ollama pull gemma2:2b

# Your application will be available at:
# - Frontend: http://localhost:3000
# - Database: PostgreSQL on port 6024
# - Ollama API: http://localhost:11434
```

#### Development Mode (Hot Reloading)
```bash
# Start in development mode with hot reloading
docker-compose up -d

# This uses docker-compose.override.yml automatically and provides:
# - Live code reloading - changes appear instantly
# - Volume mounting - your local files are live-mounted  
# - Development server - runs npm run dev
# - No rebuilding needed for code changes

# Your development server will be available at:
# - Frontend: http://localhost:3000 (with hot reload)
# - Database: PostgreSQL on port 6024
# - Ollama API: http://localhost:11434
```

#### Applying Code Changes

**In Development Mode:**
- Code changes are reflected instantly (hot reload)
- No rebuild needed for TypeScript/JavaScript changes

**In Production Mode:**
```bash
# Rebuild containers when you change code
docker-compose up --build -d

# Or rebuild just the Next.js container
docker-compose up --build client -d
```

#### Database Schema Changes
```bash
# Apply database migrations (works in both modes)
npx prisma migrate dev

# Then restart the Next.js container
docker restart nextjs_client_container
```

### Development Setup (Local Development)

For local development without Docker:

1. **Install dependencies**:
```bash
npm install
```

2. **Setup services**:
```bash
# Start PostgreSQL and Ollama services only
docker-compose up db ollama -d

# Wait for Ollama to start, then pull models
docker exec ollama_container ollama pull llama3.1
docker exec ollama_container ollama pull capybara

# Run Prisma migrations
npx prisma migrate dev
```

3. **Start development server**:
```bash
npm run dev
```

**Environment Variables for Development:**
The app automatically detects the environment:
- Production (Docker): Uses `http://ollama:11434` 
- Development (Local): Uses `http://localhost:11434`

### Environment Variables
Create a `.env` file in the root directory:
```
DATABASE_URL="postgresql://username:password@localhost:port/database"
PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
```

## Usage

1. **Add Documents**: Place PDF files in `public/assets/` directory
2. **Process Documents**: Visit `http://localhost:3000/api/load` or the system automatically processes new PDFs when queried
3. **Ask Questions**: Use the web interface at `http://localhost:3000` to ask questions about your documents
4. **Get Responses**: Receive contextual answers based on your document content with real-time streaming

The system ensures responses are only generated based on the provided context, preventing hallucinations and maintaining accuracy.

## Performance Optimizations

- **Incremental Updates**: Only new document chunks are processed
- **Efficient Chunking**: Overlapping chunks preserve context across boundaries
- **Vector Indexing**: pgvector provides fast similarity search
- **Streaming**: Real-time response delivery improves user experience
- **Connection Pooling**: Prisma manages database connections efficiently

## Model Configuration

- **Embedding Model**: `llama3.1` via Ollama (running on localhost:11434)
- **Chat Model**: `capybara` with temperature=0 for consistent responses
- **Chunk Size**: 1000 characters with 200 character overlap
- **Similarity Search**: Top 5 most relevant chunks retrieved per query

This consolidated RAG implementation provides a robust, **complete Docker solution** for document-based question answering with local LLMs. The benefits include:

- **Complete Self-Containment**: Everything runs in Docker - no external dependencies
- **Better Performance**: No network overhead between frontend and backend
- **One-Command Deployment**: `docker-compose up -d` starts the entire stack
- **Easier Development**: One codebase with end-to-end TypeScript
- **Enhanced Maintainability**: Shared types and consistent architecture
- **Complete Privacy**: All processing (including AI models) happens locally

## Docker Services

The application consists of three Docker services:

1. **PostgreSQL + pgvector**: Vector database for document storage
2. **Ollama**: Local LLM server with `llama3.1` and `capybara` models
3. **Next.js App**: Frontend and API routes

All services communicate internally via Docker networking, ensuring optimal performance and complete data privacy.