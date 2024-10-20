/*
  Warnings:

  - You are about to drop the `langchain_pg_collection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `langchain_pg_embedding` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "langchain_pg_embedding" DROP CONSTRAINT "langchain_pg_embedding_collection_id_fkey";

-- DropTable
DROP TABLE "langchain_pg_collection";

-- DropTable
DROP TABLE "langchain_pg_embedding";
