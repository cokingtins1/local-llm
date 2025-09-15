"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/newbutton";
import { IconCircleArrowUp } from "@tabler/icons-react";

export default function ChatPage() {
	const { messages, sendMessage, status } = useChat();
	const [input, setInput] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (input.trim()) {
			sendMessage({ text: input });
			setInput("");
		}
	};

	const isLoading = status === "streaming" || status === "submitted";

	return (
		<div className="flex flex-col items-center w-full max-w-3xl mx-auto p-4">
			<div className="flex flex-col gap-4 w-full mb-4">
				{messages.map((message) => (
					<div
						key={message.id}
						className={`p-3 rounded-lg border ${
							message.role === "user"
								? "bg-primary text-primary-foreground ml-auto max-w-[80%]"
								: "bg-muted text-muted-foreground mr-auto max-w-[80%]"
						}`}
					>
						<div className="text-sm font-medium mb-1 opacity-75">
							{message.role === "user" ? "You" : "Assistant"}
						</div>
						<div className="whitespace-pre-wrap">
							{(message as any).parts?.map((part: any, index: number) => {
								if (part.type === "text") {
									// Check if it's a tool call JSON string
									try {
										const parsed = JSON.parse(part.text);
										if (parsed.name === "searchKnowledgeBase") {
											return (
												<div key={index} className="italic text-sm opacity-60 mb-2">
													🔍 Searching knowledge base for: "{parsed.parameters?.query}"
												</div>
											);
										}
									} catch {
										// Not JSON, treat as regular text
									}
									return <span key={index}>{part.text}</span>;
								} else if (part.type === "tool-call") {
									return (
										<div key={index} className="italic text-sm opacity-60 mb-2">
											🔍 Searching knowledge base for: "{part.parameters?.query}"
										</div>
									);
								} else if (part.type === "tool-result") {
									return null; // Tool results are included in text responses
								}
								return null;
							}) || ""}
						</div>
					</div>
				))}
			</div>

			<form
				className="flex items-center gap-4 w-full"
				onSubmit={handleSubmit}
				autoComplete="off"
			>
				<Input
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Type your message..."
					disabled={isLoading}
					autoFocus
				/>
				<Button
					variant="expandIcon"
					Icon={IconCircleArrowUp}
					iconPlacement="right"
					type="submit"
					disabled={isLoading || !input.trim()}
				>
					{isLoading ? "Sending..." : "Submit"}
				</Button>
			</form>
		</div>
	);
}
