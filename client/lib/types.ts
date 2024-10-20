import { z } from "zod";
import { Document } from "@langchain/core/documents";

export const promptSchema = z.object({
	prompt: z.string().min(1, { message: "Please ask a question" }),
});
export type TPromptSchema = z.infer<typeof promptSchema>;

export type Chunk = Document<Record<string, any>>[];

export type langchain2 = {
	id: string;
	content: string;
	metadata: {
		loc: { lines: number[]; pageNumber: number };
		pdf: {
			info: Record<string, any>;
			version: string;
			metadata: Record<string, any>;
			totalPages: number;
		};
		uuid: string;
		source: string;
		chunkId: string;
	};
};

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
