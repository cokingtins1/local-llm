/*
  Warnings:

  - The primary key for the `prismaLangChain` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "prismaLangChain" DROP CONSTRAINT "prismaLangChain_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "prismaLangChain_pkey" PRIMARY KEY ("id");
