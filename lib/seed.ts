import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedDatabase(sessionId: string) {
	try {
		// First, create or get the chat session
		let session = await prisma.chatSession.findUnique({
			where: { id: sessionId },
		});

		if (!session) {
			session = await prisma.chatSession.create({
				data: {
					id: sessionId,
					name: `Test Session ${sessionId}`,
				},
			});
		}

		// Clear existing data for this session
		await prisma.chatResponse.deleteMany({
			where: { session_id: sessionId },
		});
		await prisma.chatPrompt.deleteMany({
			where: { session_id: sessionId },
		});

		// Seed prompts
		const prompts = [
			{
				prompt: "What is the capital of France?",
				created_at: new Date(Date.now() - 120000),
			},
			{
				prompt: "Can you explain how React hooks work?",
				created_at: new Date(Date.now() - 60000),
			},
			{
				prompt: "Write a simple Python function to calculate fibonacci numbers",
				created_at: new Date(Date.now() - 30000),
			},
		];

		const createdPrompts = [];
		for (const promptData of prompts) {
			const createdPrompt = await prisma.chatPrompt.create({
				data: {
					...promptData,
					session_id: sessionId,
				},
			});
			createdPrompts.push(createdPrompt);
		}

		// Seed responses
		const responses = [
			{
				response:
					"The capital of France is Paris. It's located in the north-central part of the country and is known for its rich history, art, culture, and iconic landmarks like the Eiffel Tower, Louvre Museum, and Notre-Dame Cathedral.",
				created_at: new Date(Date.now() - 115000),
				prompt_id: createdPrompts[0].id,
			},
			{
				response:
					"React hooks are functions that allow you to use state and other React features in functional components. The most common hooks are:\n\n• useState - manages local state\n• useEffect - handles side effects\n• useContext - accesses context values\n• useCallback - memoizes functions\n• useMemo - memoizes expensive calculations\n\nHooks must be called at the top level of your component and follow the rules of hooks.",
				created_at: new Date(Date.now() - 55000),
				prompt_id: createdPrompts[1].id,
			},
			{
				response:
					"Here's a simple Python function to calculate Fibonacci numbers:\n\n```python\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\n# More efficient iterative version:\ndef fibonacci_iterative(n):\n    if n <= 1:\n        return n\n    \n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b\n```",
				created_at: new Date(Date.now() - 25000),
				prompt_id: createdPrompts[2].id,
			},
		];

		for (const responseData of responses) {
			await prisma.chatResponse.create({
				data: {
					...responseData,
					session_id: sessionId,
				},
			});
		}

		return {
			success: true,
			message: `Seeded database with test data for session: ${sessionId}`,
		};
	} catch (error) {
		console.error("Error seeding database:", error);
		return { success: false, message: "Failed to seed database" };
	} finally {
		await prisma.$disconnect();
	}
}
