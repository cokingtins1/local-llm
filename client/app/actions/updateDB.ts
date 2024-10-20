"use server";

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Chunk } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import getChunkIds from "./getChunkIds";
import initializeDB from "./initializeDB";
import queryDB from "./queryDB";
import { initializePrismaDB } from "./initializePrismaDB";

export default async function updateDB() {
	async function loadDocuments(path: string) {
		const dirLoader = new DirectoryLoader(path, {
			".pdf": (path: string) => new PDFLoader(path),
		});

		const docs = await dirLoader.load();

		return docs;
	}

	async function splitText(docs: Chunk) {
		const textSplitter = new RecursiveCharacterTextSplitter({
			chunkSize: 1000,
			chunkOverlap: 200,
		});

		const splitDocs = await textSplitter.splitDocuments(docs);

		return splitDocs;
	}

	function calculateChunkIds(chunks: Chunk): Chunk {
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

			chunk.id = chunkId;
		}
		return chunks;
	}

	function addIdToChunk(chunks: Chunk) {
		const chunkIds = chunks.map((chunk) => chunk.id as string);
		const uuids = Array.from({ length: chunkIds.length }, () => uuidv4());
		const chunksWithIds = chunks.map((chunk, index) => ({
			...chunk,
			metadata: {
				...chunk.metadata,
				chunkId: chunkIds[index], // Custom metadata for chunk ID
				uuid: uuids[index], // Custom metadata for UUID
			},
		}));

		return chunksWithIds;
	}

	async function addToDB(chunks: Chunk) {
		const db = await initializeDB();

		const chunksWithIds = calculateChunkIds(chunks);

		addIdToChunk(chunksWithIds);

		// Upsert the documents:
		const existingChunksIds = await getChunkIds();
		const newChunks = [];

		for (let chunk of chunksWithIds) {
			if (!existingChunksIds.includes(chunk.id)) {
				newChunks.push(chunk);
			}
		}

		if (newChunks.length > 0) {
			console.log(`👉 Adding new documents: ${newChunks.length}`);
			const chunksWithIds = addIdToChunk(newChunks);
			const uuids = Array.from({ length: newChunks.length }, () =>
				uuidv4()
			);

			db.addDocuments(chunksWithIds, { ids: uuids });
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
