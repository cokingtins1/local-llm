import { Prisma, PrismaClient, prismaLangChain } from "@prisma/client";
import { PrismaVectorStore } from "@langchain/community/vectorstores/prisma";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";

export async function initializePrismaDB() {
	const prisma = new PrismaClient();

	const embeddings = new HuggingFaceInferenceEmbeddings({
		apiKey: process.env.HUGGINGFACEHUB_API_KEY,
	});

	const db = PrismaVectorStore.withModel<prismaLangChain>(prisma).create(
		embeddings,
		{
			prisma: Prisma,
			tableName: "prismaLangChain",
			vectorColumnName: "vector",
			columns: {
				id: PrismaVectorStore.IdColumn,
				content: PrismaVectorStore.ContentColumn,
				
			},
		}
	);

	return db
}
