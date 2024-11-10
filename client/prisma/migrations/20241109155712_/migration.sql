-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION "uuid-ossp";

-- CreateTable
CREATE TABLE "langchain2" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "content" TEXT,
    "metadata" JSONB,
    "vector" vector,

    CONSTRAINT "langchain2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prismaLangChain" (
    "id" TEXT NOT NULL,
    "chunkId" TEXT,
    "content" TEXT,
    "metadata" JSONB,
    "vector" vector,

    CONSTRAINT "prismaLangChain_pkey" PRIMARY KEY ("id")
);
