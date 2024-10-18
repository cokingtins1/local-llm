import { z } from "zod";
import { Document } from "@langchain/core/documents";

export const promptSchema = z.object({
	prompt: z.string().min(1),
});
export type TPromptSchema = z.infer<typeof promptSchema>;

export type Chunk = Document<Record<string, any>>[];
