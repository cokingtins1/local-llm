import { embeddingModel } from "@/MODELS";
import { OllamaEmbeddings } from "@langchain/ollama";

export const ollamaEmbeddings = new OllamaEmbeddings({
	model: embeddingModel,
	baseUrl: process.env.OLLAMA_URL || "http://localhost:11434",
});

