"use server";

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Chunk, PrismaChunk } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import getChunkIds from "./getChunkIds";
import initializeDB from "./initializeDB";
import queryDB from "./queryDB";
import { initializePrismaDB } from "./initializePrismaDB";
import { PrismaClient } from "@prisma/client";
import { Document } from "@langchain/core/documents";

const prisma = new PrismaClient();

export default async function updatePrismaDB() {
	async function loadDocuments(path: string): Promise<PrismaChunk> {
		const dirLoader = new DirectoryLoader(path, {
			".pdf": (path: string) => new PDFLoader(path),
		});

		const docs: Document<Record<string, any>>[] = await dirLoader.load();

		const chunks: PrismaChunk = docs.map((doc) => ({
			id: doc.id,
			metadata: {
				loc: {
					pageNumber: doc.metadata.loc.pageNumber,
					lines: doc.metadata.loc.lines,
				},
				pdf: {
					info: doc.metadata.pdf.info,
					version: doc.metadata.pdf.version,
					metadata: doc.metadata.pdf.metadata,
					totalPages: doc.metadata.pdf.totalPages,
				},
				uuid: doc.metadata.uuid,
				source: doc.metadata.source,
			},
			chunkId: doc.metadata.chunkId,
			pageContent: doc.pageContent,
		}));

		return chunks;
	}

	async function splitText(docs: PrismaChunk): Promise<PrismaChunk> {
		const textSplitter = new RecursiveCharacterTextSplitter({
			chunkSize: 1000,
			chunkOverlap: 200,
		});

		const splitDocs = await textSplitter.splitDocuments(docs);

		return splitDocs as PrismaChunk;
	}

	function calculateChunkIds(chunks: PrismaChunk): PrismaChunk {
		let lastPageId: string | null = null;
		let currentChunkIndex = 0;

		for (let chunk of chunks) {
			let source = chunk.metadata.source;
			let page = chunk.metadata.loc.pageNumber;
			let currentPageId = `${source}:${page}`;

			if (currentPageId === lastPageId) {
				currentChunkIndex += 1;
			} else {
				currentChunkIndex = 0;
			}

			let chunkId = `${currentPageId}:${currentChunkIndex}`;
			lastPageId = currentPageId;

			chunk.chunkId = chunkId;
			chunk.id = crypto.randomUUID();
		}
		return chunks;
	}

	function addIdToChunk(chunks: PrismaChunk) {
		const chunksWithIds = chunks.map((chunk, index) => ({
			...chunk,
			metadata: {
				...chunk.metadata,
				chunkId: chunk.chunkId,
				uuid: chunk.id,
			},
		}));

		return chunksWithIds;
	}

	async function addToDB(chunks: PrismaChunk) {
		const db = await initializePrismaDB();

		const chunksWithIds = calculateChunkIds(chunks);
		const finalChunks = addIdToChunk(chunksWithIds);

		const prismaChunks = await prisma.prismaLangChain.findMany({
			select: { chunkId: true },
		});

		const existingChunks = prismaChunks.map((chunk) => chunk.chunkId);

		const newChunks = finalChunks.filter(
			(chunk) => !existingChunks.includes(chunk?.chunkId)
		);

		if (newChunks.length > 0) {
			console.log(`👉 Adding new documents: ${newChunks.length}`);

			await db.addModels(
				await prisma.$transaction(
					finalChunks.map((chunk) =>
						prisma.prismaLangChain.create({
							data: {
								id: chunk.metadata.uuid,
								chunkId: chunk.chunkId,
								content: chunk.pageContent,
								metadata: chunk.metadata,
							},
						})
					)
				)
			);
		} else {
			console.log("✅ No new new documents to add");
		}
	}

	const path =
		"C:/Users/cokin/OneDrive/Documents/GitHub/local-llm/server/assets/";

	const docs = await loadDocuments(path);
	const chunks = await splitText(docs);

	addToDB(chunks);
}
