"use client";

import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { promptSchema, TPromptSchema } from "@/lib/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Page() {
	const [chatResponse, setChatResponse] = useState("");
	const [executionTime, setExecutionTime] = useState(0);

	const [document, setDocument] = useState("");

	const form = useForm<TPromptSchema>({
		resolver: zodResolver(promptSchema),
		defaultValues: {
			prompt: "",
		},
	});

	const onSubmit = async (text: TPromptSchema) => {
		const t0 = new Date().getTime();
		const res = await fetch("http://localhost:8080/", {
			method: "POST",
			body: JSON.stringify({
				prompt: text.prompt,
			}),
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (res.ok) {
			const responseData = await res.json();
			const t1 = new Date().getTime();
			setExecutionTime((t1 - t0) / 1000);
			setChatResponse(responseData.result);
		}
	};

	const onClick = async () => {
		const res = await fetch("http://localhost:8080/load", {
			method: "GET",
		});

		if (res.ok) {
			const responseData = await res.text();
			setDocument(responseData)
		}
	};

	return (
		<div className='flex flex-col items-center gap-4'>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<FormField
						control={form.control}
						name="prompt"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Input
										className=""
										type="text"
										placeholder="ask your question"
										{...field}
									/>
								</FormControl>
							</FormItem>
						)}
					></FormField>
				</form>
			</Form>
			{chatResponse && (
				<>
					<p className="text-white">{chatResponse}</p>
					<p className="text-white">
						Time to response: {executionTime} seconds
					</p>
				</>
			)}
			<div className='flex flex-col items-center gap-4'>
				<Button onClick={onClick}>Load Document</Button>
				<p>{document && document}</p>
			</div>
		</div>
	);
}

