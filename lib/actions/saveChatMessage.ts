"use server";

import prisma from "@/prisma/__base";

export async function saveChatMessage(
	prompt: string,
	response: string,
	sessionId: string
) {
	try {
		// First ensure the session exists
		let session = await prisma.chatSession.findUnique({
			where: { id: sessionId }
		});

		if (!session) {
			session = await prisma.chatSession.create({
				data: {
					id: sessionId,
					name: `Chat Session ${sessionId}`,
				}
			});
		}

		// Create the prompt
		const chatPrompt = await prisma.chatPrompt.create({
			data: {
				prompt,
				session_id: sessionId,
			}
		});

		// Create the response
		const chatResponse = await prisma.chatResponse.create({
			data: {
				response,
				session_id: sessionId,
				prompt_id: chatPrompt.id,
			}
		});

		return {
			success: true,
			prompt: chatPrompt,
			response: chatResponse
		};
	} catch (error) {
		console.error('Error saving chat message:', error);
		return {
			success: false,
			error: 'Failed to save message to database'
		};
	}
}