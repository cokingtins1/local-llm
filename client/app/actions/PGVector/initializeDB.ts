import { PoolConfig } from "pg";
import {
	DistanceStrategy,
	PGVectorStore,
} from "@langchain/community/vectorstores/pgvector";
import { ollamaEmbeddings } from "../embeddings/ollamaEmbeddings";

export default async function initializeDB() {
	const embeddings = ollamaEmbeddings;

	const config = {
		postgresConnectionOptions: {
			type: "postgres",
			host: "localhost",
			port: 6024,
			user: "langchain",
			password: "langchain",
			database: "langchain",
		} as PoolConfig,
		tableName: "langchain2",
		columns: {
			idColumnName: "id",
			vectorColumnName: "vector",
			contentColumnName: "content",
			metadataColumnName: "metadata",
		},
		// supported distance strategies: cosine (default), innerProduct, or euclidean
		distanceStrategy: "cosine" as DistanceStrategy,
	};

	const db = await PGVectorStore.initialize(embeddings, config);

	return db;
}
