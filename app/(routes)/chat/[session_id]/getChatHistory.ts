import prisma from "@/prisma/__base";

export async function getChatHistory(session_id: string) {
	try {
		const [prompts, responses] = await prisma.$transaction([
			prisma.chatPrompt.findMany({
				where: { session_id },
				orderBy: { created_at: "asc" },
			}),
			prisma.chatResponse.findMany({
				where: { session_id },
				orderBy: { created_at: "asc" },
			}),
		]);

		return {
			success: true,
			prompts,
			responses,
		};
	} catch (error) {
		console.error("Error fetching chat history:", error);
		return {
			success: false,
			prompts: [],
			responses: [],
			error: "Failed to fetch chat history",
		};
	}
}
