-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateExtension
-- CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "DocumentChunks" (
    "id" TEXT NOT NULL,
    "chunkId" TEXT,
    "content" TEXT,
    "metadata" JSONB,
    "vector" VECTOR(768),

    CONSTRAINT "DocumentChunks_pkey" PRIMARY KEY ("id")
);


