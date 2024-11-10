import {
	PGVectorStore,
	DistanceStrategy,
} from "@langchain/community/vectorstores/pgvector";

import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { CharacterTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

import { PoolConfig } from "pg";

export default async function populate_db() {
	const embeddings = new HuggingFaceInferenceEmbeddings({
		apiKey: process.env.HUGGINGFACEHUB_API_KEY,
	});

	const config = {
		postgresConnectionOptions: {
			type: "postgres",
			host: "127.0.0.1",
			port: 5433,
			user: "myuser",
			password: "ChangeMe",
			database: "api",
		} as PoolConfig,
		tableName: "testlangchainjs",
		columns: {
			idColumnName: "id",
			vectorColumnName: "vector",
			contentColumnName: "content",
			metadataColumnName: "metadata",
		},
		// supported distance strategies: cosine (default), innerProduct, or euclidean
		distanceStrategy: "cosine" as DistanceStrategy,
	};

	// const db = await PGVectorStore.initialize()
}

