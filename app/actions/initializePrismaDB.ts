import { DocumentChunks, Prisma, PrismaClient } from "@prisma/client";
import { PrismaVectorStore } from "@langchain/community/vectorstores/prisma";
import { ollamaEmbeddings } from "./embeddings/ollamaEmbeddings";

export async function initializePrismaDB() {
	const prisma = new PrismaClient();

	const embeddings = ollamaEmbeddings;

	const db = PrismaVectorStore.withModel<DocumentChunks>(prisma).create(
		embeddings,
		{
			prisma: Prisma,
			tableName: "DocumentChunks",
			vectorColumnName: "vector",
			columns: {
				id: PrismaVectorStore.IdColumn,
				content: PrismaVectorStore.ContentColumn,
			},
		}
	);

	return db;
}
