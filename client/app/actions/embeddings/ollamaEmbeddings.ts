import { OllamaEmbeddings } from "@langchain/ollama";

export const ollamaEmbeddings = new OllamaEmbeddings({
	model: "capybara",
	baseUrl: "http://localhost:11434", // Port Ollama is running on
});
