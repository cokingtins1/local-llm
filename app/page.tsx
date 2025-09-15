import PromptForm from "@/components/custom/PromptForm";
import { ChatPrompt, ChatResponse } from "@prisma/client";

export default async function Page() {
	const CHAT_SESSION = "c6e20e12-a518-aac6-3907-f614e7fd2daf";

	const dummyChatPrompts: ChatPrompt[] = [
		{
			id: "1",
			prompt: "What is the capital of France?",
			session_id: CHAT_SESSION,
			created_at: new Date(Date.now() - 120000),
		},
		{
			id: "2",
			prompt: "Can you explain how React hooks work?",
			session_id: CHAT_SESSION,
			created_at: new Date(Date.now() - 60000),
		},
		{
			id: "3",
			prompt: "Write a simple Python function to calculate fibonacci numbers",
			session_id: CHAT_SESSION,
			created_at: new Date(Date.now() - 30000),
		},
	];

	const dummyChatResponses: ChatResponse[] = [
		{
			id: "1",
			response:
				"The capital of France is Paris. It's located in the north-central part of the country and is known for its rich history, art, culture, and iconic landmarks like the Eiffel Tower, Louvre Museum, and Notre-Dame Cathedral.",
			session_id: CHAT_SESSION,
			created_at: new Date(Date.now() - 115000),
			prompt_id: "1",
		},
		{
			id: "2",
			response:
				"React hooks are functions that allow you to use state and other React features in functional components. The most common hooks are:\n\n• useState - manages local state\n• useEffect - handles side effects\n• useContext - accesses context values\n• useCallback - memoizes functions\n• useMemo - memoizes expensive calculations\n\nHooks must be called at the top level of your component and follow the rules of hooks.",
			session_id: CHAT_SESSION,
			created_at: new Date(Date.now() - 55000),
			prompt_id: "2",
		},
		{
			id: "3",
			response:
				"Here's a simple Python function to calculate Fibonacci numbers:\n\n```python\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\n# More efficient iterative version:\ndef fibonacci_iterative(n):\n    if n <= 1:\n        return n\n    \n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b\n```",
			session_id: CHAT_SESSION,
			created_at: new Date(Date.now() - 25000),
			prompt_id: "3",
		},
	];

	return (
		<div className="flex flex-col items-center w-full">
			<PromptForm
				promptHistory={dummyChatPrompts}
				responseHistory={dummyChatResponses}
			/>

			{/* <div className="flex items-center gap-4 mt-8">
				<p>Test DB</p>
				<form
					action={async () => {
						"use server";
						await prisma.documentChunks.deleteMany({});
					}}
				>
					<Button>Delete Data</Button>
				</form>
			</div> */}
		</div>
	);
}
