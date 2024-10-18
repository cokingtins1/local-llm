// import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
// import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
// import { CharacterTextSplitter } from "@langchain/textsplitters";
// // import { PrismaClient, Document, Prisma } from "@prisma/client";
// import { PrismaVectorStore } from "@langchain/community/vectorstores/prisma";
// import {
// 	RunnablePassthrough,
// 	RunnableSequence,
// } from "@langchain/core/runnables";
// import { ChatPromptTemplate } from "@langchain/core/prompts";
// // import { Ollama } from "@langchain/ollama";
// import { StringOutputParser } from "@langchain/core/output_parsers";
// import {
// 	PGVectorStore,
// 	DistanceStrategy,
// } from "@langchain/community/vectorstores/pgvector";

// export default async function execute() {
// 	"use server";

// 	const start = new Date().getTime();

// 	const content =
// 		"/home/cokingtins1/Documents/test gpt docs/2024_SSOE_Benefits_Guide.pdf";
// 	const loader = new PDFLoader(content);
// 	const docs = await loader.load();

// 	const t1 = new Date().getTime();
// 	console.log(`Load PDF: ${(t1 - start) / 1000} seconds`);

// 	const model = new Ollama({
// 		model: "llama3.1",
// 		temperature: 0,
// 		maxRetries: 2,
// 	});

// 	const extractedText = docs.map((doc) => doc.pageContent).join("\n");

// 	const t2 = new Date().getTime();
// 	console.log(`Extract text: ${(t2 - t1) / 1000} seconds`);

// 	const textSplitter = new CharacterTextSplitter({
// 		separator: "\n",
// 		chunkSize: 1000,
// 		chunkOverlap: 200,
// 	});

// 	const texts = await textSplitter.createDocuments([extractedText]);

// 	const t3 = new Date().getTime();
// 	console.log(`Split text: ${(t3 - t2) / 1000} seconds`);

// 	const embeddings = new HuggingFaceInferenceEmbeddings({
// 		apiKey: process.env.HUGGINGFACEHUB_API_KEY,
// 	});

// 	const db = new PrismaClient();

// 	const vectorStore = PrismaVectorStore.withModel<Document>(db).create(
// 		embeddings,
// 		{
// 			prisma: Prisma,
// 			tableName: "Document",
// 			vectorColumnName: "vector",
// 			columns: {
// 				id: PrismaVectorStore.IdColumn,
// 				content: PrismaVectorStore.ContentColumn,
// 			},
// 		}
// 	);

// 	const t4 = new Date().getTime();
// 	console.log(`Create vectorStore: ${(t4 - t3) / 1000} seconds`);

// 	await vectorStore.addModels(
// 		await db.$transaction(
// 			texts.map((content) =>
// 				db.document.create({ data: { content: content.pageContent } })
// 			)
// 		)
// 	);

// 	const t5 = new Date().getTime();
// 	console.log(`vectorStore.addModels: ${(t5 - t4) / 1000} seconds`);

// 	const vectorStoreRetriever = vectorStore.asRetriever();

// 	const SYSTEM_TEMPLATE = `Use the following pieces of context to answer the question at the end.
// If you don't know the answer, just say that you don't know, don't try to make up an answer.
// ----------------
// {context}`;

// 	const prompt = ChatPromptTemplate.fromMessages([
// 		["system", SYSTEM_TEMPLATE],
// 		["human", "{question}"],
// 	]);

// 	const chain = RunnableSequence.from([
// 		{
// 			context: vectorStoreRetriever,
// 			question: new RunnablePassthrough(),
// 		},
// 		prompt,
// 		model,
// 		new StringOutputParser(),
// 	]);

// 	// const answer = await chain.invoke("how much PTO do I have as an associate employee?");
// 	// const answer = await chain.invoke("How much is 100 Wellness Works points worth?");
// 	const t6 = new Date().getTime();
// 	console.log(`Time before question is asked: ${(t6 - t5) / 1000} seconds`);

// 	const answer = await chain.invoke(
// 		"What is the vesting period for my contributions to be 100% vested?"
// 	);

// 	const t7 = new Date().getTime();
// 	console.log(`Time to answer question: ${(t7 - t6) / 1000} seconds`);
// 	console.log(answer);
// }
