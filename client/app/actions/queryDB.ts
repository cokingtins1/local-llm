import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { PoolConfig } from "pg";
import {
	DistanceStrategy,
	PGVectorStore,
} from "@langchain/community/vectorstores/pgvector";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Ollama } from "@langchain/ollama";
import {
	RunnablePassthrough,
	RunnableSequence,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

import initializeDB from "./initializeDB";

function getTime(t0: number, label: string) {
	const tf = new Date().getTime();
	console.log(`${label} : ${(tf - t0) / 1000} seconds`);
}

export default async function queryDB(
	query: string
): Promise<ReadableStream<string>> {
	const t0 = new Date().getTime();

	const db = await initializeDB();
	const model = new Ollama({
		model: "capybara",
		temperature: 0,
		maxRetries: 2,
	});

	getTime(t0, "initialize db");
	const t1 = new Date().getTime();

	const results = await db.similaritySearchWithScore(query, 5);
	const contextTextArray = await Promise.all(
		results.map(async ([doc, _score]) => doc.pageContent)
	);

	getTime(t1, "similarity score");
	const t2 = new Date().getTime();

	const joinedContextText = contextTextArray.join("\n\n---\n\n");

	const TEMPLATE = `
            PROMPT_TEMPLATE = 
            Answer the question based only on the following context:

            {context}

            ---

			{context}

            Answer the question based on the above context: {question}

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
