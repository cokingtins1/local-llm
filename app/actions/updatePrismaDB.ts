"use server";

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PrismaChunk } from "@/lib/types";
import { initializePrismaDB } from "./initializePrismaDB";
import { PrismaClient } from "@prisma/client";
import { Document } from "@langchain/core/documents";

const prisma = new PrismaClient();

export default async function updatePrismaDB() {
	// Quick check - if we have documents already, skip the expensive file scanning
	const existingCount = await prisma.documentChunks.count();
	if (existingCount > 0) {
		console.log(`✅ Database already has ${existingCount} chunks, skipping file scan`);
		return;
	}

	const OLLAMA_URL = process.env.OLLAMA_URL || "http://ollama:11434";

	async function getEmbedding(text: string): Promise<number[]> {
		const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				model: "nomic-embed-text",
				prompt: text,
			}),
		});

		if (!response.ok) {
			throw new Error(
				`Embedding API error: ${
					response.status
				} ${await response.text()}`
			);
		}

		const data = await response.json();
		return data.embedding ?? [];
	}
	async function loadDocuments(path: string): Promise<PrismaChunk> {
		const dirLoader = new DirectoryLoader(
			path,
			{
				".pdf": (path: string) => new PDFLoader(path),
			},
			true, // recursive
			"ignore" // unknownHandling - ignore unknown file types instead of warning
		);

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

	// async function addToDB(chunks: PrismaChunk) {
	// 	const db = await initializePrismaDB();

	// 	const chunksWithIds = calculateChunkIds(chunks);
	// 	const finalChunks = addIdToChunk(chunksWithIds);

	// 	const prismaChunks = await prisma.documentChunks.findMany({
	// 		select: { chunkId: true },
	// 	});

	// 	const existingChunks = prismaChunks.map((chunk) => chunk.chunkId);

	// 	const newChunks = finalChunks.filter(
	// 		(chunk) => !existingChunks.includes(chunk?.chunkId)
	// 	);

	// 	if (newChunks.length > 0) {
	// 		console.log(`👉 Adding new documents: ${newChunks.length}`);

	// 		// Convert to Document format for addDocuments
	// 		const documents = newChunks.map(
	// 			(chunk) =>
	// 				new Document({
	// 					pageContent: chunk.pageContent,
	// 					metadata: {
	// 						id: chunk.metadata.uuid || crypto.randomUUID(),
	// 						chunkId: chunk.chunkId,
	// 						content: chunk.pageContent,
	// 						metadata: {
	// 							source: chunk.metadata.source,
	// 							pageNumber: chunk.metadata.loc.pageNumber,
	// 						},
	// 					},
	// 				})
	// 		);

	// 		await db.addDocuments(documents);
	// 	} else {
	// 		console.log("✅ No new documents to add");
	// 	}
	// }

	async function addToDB(chunks: PrismaChunk) {
		const chunksWithIds = calculateChunkIds(chunks);
		const finalChunks = addIdToChunk(chunksWithIds);

		const prismaChunks = await prisma.documentChunks.findMany({
			select: { chunkId: true },
		});

		const existingChunks = prismaChunks.map((chunk) => chunk.chunkId);

		const newChunks = finalChunks.filter(
			(chunk) => !existingChunks.includes(chunk?.chunkId)
		);

		if (newChunks.length === 0) {
			console.log("✅ No new documents to add");
			return;
		}

		console.log(`👉 Adding new documents: ${newChunks.length}`);

		// Loop through each chunk, get embedding, and insert into PostgreSQL
		for (const chunk of newChunks) {
			const embedding = await getEmbedding(chunk.pageContent);

			if (embedding.length === 0) {
				console.warn(
					`⚠️ No embedding returned for chunk ${chunk.chunkId}`
				);
				continue;
			}

			// Convert embedding array to vector literal for PostgreSQL
			const vectorLiteral = embedding.join(",");

			await prisma.$executeRawUnsafe(
				`
	  INSERT INTO "DocumentChunks" ("id", "chunkId", "content", "metadata", "vector")
	  VALUES (
	    '${chunk.id}',
	    '${chunk.chunkId}',
	    $1,
	    $2::jsonb,
	    '[${vectorLiteral}]'::vector
	  )
	`,
				chunk.pageContent,
				JSON.stringify(chunk.metadata)
			);
		}

		console.log("✅ All new chunks inserted with embeddings");
	}

	// Use Docker-mounted assets path in production, local path in development
	// const path =
	// 	process.env.NODE_ENV === "production"
	// 		? "/app/public/assets/"
	// 		: "./public/assets/";

	// Check if running in Docker by looking for mounted volume
	const isInDocker = process.env.DOCKER_ENV === "true" || require('fs').existsSync('/app/pdf-data');

	const path = isInDocker
		? "/app/pdf-data" // Docker mounted path
		: "C:\\Users\\cokin\\OneDrive\\Documents\\Projects\\Local LLM\\Specs\\PDF"; // Local development path

	const docs = await loadDocuments(path);
	const chunks = await splitText(docs);

	await addToDB(chunks);
}
