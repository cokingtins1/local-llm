/*
  Warnings:

  - Added the required column `chunkId` to the `prismaLangChain` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "prismaLangChain" ADD COLUMN     "chunkId" TEXT NOT NULL;
