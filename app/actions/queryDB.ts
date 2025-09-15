import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Ollama } from "@langchain/ollama";

import { initializePrismaDB } from "./initializePrismaDB";
import { chatModel } from "@/MODELS";

function getTime(t0: number, label: string) {
	const tf = new Date().getTime();
	console.log(`${label} : ${(tf - t0) / 1000} seconds`);
}

export default async function queryDB(
	query: string
): Promise<ReadableStream<string>> {
	const t0 = new Date().getTime();

	const db = await initializePrismaDB();
	const model = new Ollama({
		model: chatModel,
		temperature: 0,
		maxRetries: 2,
		baseUrl: process.env.OLLAMA_URL || "http://localhost:11434",
	});

	getTime(t0, "initialize db");
	const t1 = new Date().getTime();

	const results = await db.similaritySearchWithScore(query, 5);

	if (results.length === 0) {
		console.log("No similarity search results found");
	}

	const contextTextArray = await Promise.all(
		results.map(async ([doc, score]) => {
			return doc.pageContent;
		})
	);

	getTime(t1, "similarity score");
	const t2 = new Date().getTime();

	const joinedContextText = contextTextArray.join("\n\n---\n\n");

	const TEMPLATE = `
	You are a helpful assistant that answers questions based on provided context. Use only the information from the context to answer the question. If the context doesn't contain enough information to answer the question, say so clearly.
            Answer the question based only on the following context:

            Context: {context}
			Question: {question}

            ---

            Instructions:
			- Answer based only on the provided context
			- Be specific and cite relevant parts of the context
			- If the context doesn't contain the answer, clearly state that
			- Keep your answer concise but complete
			- Format your response in a clear, readable way 

            `;

	const promptTemplate = ChatPromptTemplate.fromTemplate(TEMPLATE);
	const prompt = await promptTemplate.format({
		context: joinedContextText,
		question: query,
	});

	getTime(t2, "chat prompt template");
	const t3 = new Date().getTime();

	const stream = await model.stream(prompt);

	getTime(t3, "model.invoke");

	return stream;
}
