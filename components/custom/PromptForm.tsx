"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconCircleArrowUp } from "@tabler/icons-react";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { promptSchema, TPromptSchema } from "@/lib/types";
import { ChatPrompt, ChatResponse } from "@prisma/client";
import { saveChatMessage } from "@/lib/actions/saveChatMessage";

type PromptFormType = {
	promptHistory?: ChatPrompt[];
	responseHistory?: ChatResponse[];
	session?: string;
};

type OptimisticMessage = {
	id: string;
	prompt: string;
	response?: string;
	isLoading?: boolean;
	created_at: Date;
};

export default function PromptForm({
	promptHistory,
	responseHistory,
	session,
}: PromptFormType) {
	const [optimisticMessages, setOptimisticMessages] = useState<
		OptimisticMessage[]
	>([]);
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [optimisticMessages]);

	const form = useForm<TPromptSchema>({
		resolver: zodResolver(promptSchema),
		defaultValues: {
			prompt: "",
		},
	});

	const onSubmit = async (data: TPromptSchema) => {
		const messageId = Date.now().toString();
		const userPrompt = data.prompt;

		// Optimistically add the user's message
		const newMessage: OptimisticMessage = {
			id: messageId,
			prompt: userPrompt,
			response: "",
			isLoading: true,
			created_at: new Date(),
		};

		setOptimisticMessages((prev) => [...prev, newMessage]);
		setIsLoading(true);
		form.reset();

		try {
			const res = await fetch("/api/chat", {
				method: "POST",
				body: JSON.stringify({
					prompt: userPrompt,
					session: session,
				}),
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (res.ok && res.body) {
				const reader = res.body.getReader();
				const decoder = new TextDecoder();
				let done = false;
				let fullResponse = "";

				while (!done) {
					const { value, done: readerDone } = await reader.read();
					done = readerDone;

					if (value) {
						const chunk = decoder.decode(value, { stream: true });
						fullResponse += chunk;

						// Update the optimistic message with streaming response
						setOptimisticMessages((prev) =>
							prev.map((msg) =>
								msg.id === messageId
									? {
											...msg,
											response: fullResponse,
											isLoading: false,
									  }
									: msg
							)
						);
					}
				}

				// Persist to database after streaming completes
				if (session && fullResponse) {
					try {
						await saveChatMessage(
							userPrompt,
							fullResponse,
							session
						);
						console.log("Message saved to database successfully");
					} catch (error) {
						console.error(
							"Failed to save message to database:",
							error
						);
					}
				}
			} else {
				// Handle error - remove loading state
				setOptimisticMessages((prev) =>
					prev.map((msg) =>
						msg.id === messageId
							? {
									...msg,
									response: "Error: Failed to get response",
									isLoading: false,
							  }
							: msg
					)
				);
			}
		} catch (error) {
			console.error("Chat error:", error);
			setOptimisticMessages((prev) =>
				prev.map((msg) =>
					msg.id === messageId
						? {
								...msg,
								response: "Error: Failed to send message",
								isLoading: false,
						  }
						: msg
				)
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen w-full">
			<div className="p-4 pb-32">
				<div className="max-w-3xl mx-auto space-y-6">
					{/* Historical messages */}
					{promptHistory?.map((prompt) => {
						const response = responseHistory?.find(
							(r) => r.prompt_id === prompt.id
						);
						return (
							<div key={prompt.id} className="space-y-3">
								<div className="flex justify-end">
									<div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-[80%]">
										{prompt.prompt}
									</div>
								</div>
								{response && (
									<div className="flex justify-start">
										<div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 max-w-[80%]">
											<pre className="whitespace-pre-wrap font-sans text-sm">
												{response.response}
											</pre>
										</div>
									</div>
								)}
							</div>
						);
					})}

					{/* Optimistic messages */}
					{optimisticMessages.map((message) => (
						<div key={message.id} className="space-y-3">
							<div className="flex justify-end">
								<div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-[80%]">
									{message.prompt}
								</div>
							</div>
							<div className="flex justify-start">
								<div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 max-w-[80%]">
									{message.isLoading ? (
										<div className="flex items-center gap-2">
											<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
											<div
												className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
												style={{
													animationDelay: "0.1s",
												}}
											></div>
											<div
												className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
												style={{
													animationDelay: "0.2s",
												}}
											></div>
											<span className="text-gray-500 text-sm ml-2">
												AI is thinking...
											</span>
										</div>
									) : (
										<pre className="whitespace-pre-wrap font-sans text-sm">
											{message.response}
										</pre>
									)}
								</div>
							</div>
						</div>
					))}
					<div ref={messagesEndRef} />
				</div>
			</div>

			<div className="fixed bottom-0 left-0 right-0 bg-gray-50 dark:bg-gray-900 ">
				<div className="max-w-3xl mx-auto pb-4">
					<Form {...form}>
						<form
							className="flex items-center gap-4 w-full"
							autoComplete="off"
							onSubmit={form.handleSubmit(onSubmit)}
						>
							<FormField
								control={form.control}
								name="prompt"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormControl>
											<Input
												className="bg-white dark:bg-gray-900"
												autoFocus
												{...field}
											/>
										</FormControl>
									</FormItem>
								)}
							/>
							<Button
								type="submit"
								disabled={!form.formState.isDirty || isLoading}
							>
								{isLoading ? "Sending..." : "Submit"}
							</Button>
						</form>
					</Form>
					{form.formState.errors.prompt?.message && (
						<p className="text-rose-600 mt-2">
							{form.formState.errors.prompt?.message}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
