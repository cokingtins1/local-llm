import { z } from "zod";
import { Document } from "@langchain/core/documents";

export const promptSchema = z.object({
	prompt: z.string().min(1, { message: "Please ask a question" }),
});
export type TPromptSchema = z.infer<typeof promptSchema>;

export type Chunk = Document<Record<string, any>>[];

export type PrismaChunk = {
	id?: string;
	metadata: {
		loc: { pageNumber: number; lines: any };
		pdf: { info: any; version: string; metadata: any; totalPages: number };
		uuid?: string;
		source: string;
	};
	chunkId: string | null;
	pageContent: string;
}[];
