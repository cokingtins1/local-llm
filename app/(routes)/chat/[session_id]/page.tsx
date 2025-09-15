import PromptForm from "@/components/custom/PromptForm";
import { ChatPrompt, ChatResponse } from "@prisma/client";
import { getChatHistory } from "./getChatHistory";

export default async function Page({
	params,
}: {
	params: Promise<{ session_id: string }>;
}) {
	const { session_id } = await params;

	const { prompts, responses } = await getChatHistory(session_id);

	// console.log("session_id: ", session_id);

	return (
		<div className="flex flex-col items-center w-full">
			<PromptForm
				promptHistory={prompts}
				responseHistory={responses}
				session={session_id}
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
