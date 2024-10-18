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

export default async function queryDB(query: string) {
	const db = await initializeDB();
	const model = new Ollama({
		model: "capybara",
		temperature: 0,
		maxRetries: 2,
	});

	const results = await db.similaritySearchWithScore(query, 5);
	const contextTextArray = await Promise.all(
		results.map(async ([doc, _score]) => doc.pageContent)
	);

	const joinedContextText = contextTextArray.join("\n\n---\n\n");

	const TEMPLATE = `
            PROMPT_TEMPLATE = 
            Answer the question based only on the following context:

            {context}

            ---

            Answer the question based on the above context: {question}
            `;

	const promptTemplate = ChatPromptTemplate.fromTemplate(TEMPLATE);
	const prompt = await promptTemplate.format({
		context: joinedContextText,
		question: query,
	});

	// const responseText = await model.invoke(prompt);
	console.log("responseText:", prompt);

	const SYSTEM_TEMPLATE = `Use the following pieces of context to answer the question at the end.
      If you don't know the answer, just say that you don't know, don't try to make up an answer. Only provide answers to questions that are relative to the provided context.
      ----------------
      {context}`;

	// const dbRetriever = db.asRetriever();

	// const prompt = ChatPromptTemplate.fromMessages([
	// 	["system", SYSTEM_TEMPLATE],
	// 	["human", "{question}"],
	// ]);

	// const chain = RunnableSequence.from([
	// 	{
	// 		context: dbRetriever,
	// 		question: new RunnablePassthrough(),
	// 	},
	// 	prompt,
	// 	model,
	// 	new StringOutputParser(),
	// ]);

	// const answer = await chain.invoke(query);

	return "done";
}
