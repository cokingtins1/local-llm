import { convertToModelMessages, streamText, UIMessage, tool } from "ai";
import { createOllama } from "ollama-ai-provider-v2";
import { z } from "zod";
import queryDB from "@/app/actions/queryDB";
import updatePrismaDB from "@/app/actions/updatePrismaDB";
import { promptSchema } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
	const body = await req.json();

	// Accept either "prompt" or "message"
	const inputPrompt = body.prompt ?? body.message;

	const result = promptSchema.safeParse({ prompt: inputPrompt });
	let zodErrors = {};

	if (!result.success) {
		result.error.issues.forEach((issue) => {
			zodErrors = { ...zodErrors, [issue.path[0]]: issue.message };
		});

		return NextResponse.json(
			Object.keys(zodErrors).length > 0
				? { errors: zodErrors }
				: { success: { data: "data..." } }
		);
	}

	const { prompt } = result.data;

	await updatePrismaDB();

	const stream = await queryDB(prompt);

	return new Response(stream, {
		headers: { "Content-Type": "text/plain" },
	});
}

const ollama = createOllama({
	baseURL: "http://host.docker.internal:11434/api",
});

// export async function POST(req: Request) {
// 	const { messages }: { messages: UIMessage[] } = await req.json();

// 	const result = streamText({
// 		model: ollama("llama3.1:latest"),
// 		messages: convertToModelMessages(messages),
// 		system: `You are a helpful assistant. Check your knowledge base before answering any questions. Only respond to questions using information from tool calls. If no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
// 		tools: {
// 			searchKnowledgeBase: {
// 				description:
// 					"Search the knowledge base for relevant information to answer user questions",
// 				inputSchema: z.object({
// 					query: z
// 						.string()
// 						.describe(
// 							"The search query to find relevant information"
// 						),
// 				}),
// 				execute: async ({ query }: { query: string }) => {
// 					try {
// 						await updatePrismaDB();
// 						const stream = await queryDB(query);
// 						const reader = stream.getReader();
// 						const decoder = new TextDecoder();
// 						let result = "";

// 						while (true) {
// 							const { done, value } = await reader.read();
// 							if (done) break;
// 							if (value) {
// 								if (typeof value === "string") {
// 									result += value;
// 								} else {
// 									result += decoder.decode(value, {
// 										stream: true,
// 									});
// 								}
// 							}
// 						}

// 						return (
// 							result ||
// 							"No relevant information found in the knowledge base."
// 						);
// 					} catch (error) {
// 						console.error("Error querying knowledge base:", error);
// 						return "Error accessing knowledge base.";
// 					}
// 				},
// 			},
// 		},
// 	});

// 	return result.toUIMessageStreamResponse();
// }
