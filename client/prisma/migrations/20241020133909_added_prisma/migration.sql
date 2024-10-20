CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

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
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "content" TEXT,
    "metadata" JSONB,
    "vector" vector,

    CONSTRAINT "prismaLangChain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "langchain_pg_collection" (
    "uuid" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "cmetadata" JSON,

    CONSTRAINT "langchain_pg_collection_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "langchain_pg_embedding" (
    "id" VARCHAR NOT NULL,
    "collection_id" UUID,
    "embedding" vector,
    "document" VARCHAR,
    "cmetadata" JSONB,

    CONSTRAINT "langchain_pg_embedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "langchain_pg_collection_name_key" ON "langchain_pg_collection"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ix_langchain_pg_embedding_id" ON "langchain_pg_embedding"("id");

-- CreateIndex
CREATE INDEX "ix_cmetadata_gin" ON "langchain_pg_embedding" USING GIN ("cmetadata" jsonb_path_ops);

-- AddForeignKey
ALTER TABLE "langchain_pg_embedding" ADD CONSTRAINT "langchain_pg_embedding_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "langchain_pg_collection"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION;
