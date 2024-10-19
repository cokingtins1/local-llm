"use client";

import React, { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/newbutton";
import { IconCircleArrowUp } from "@tabler/icons-react";
import { Form, FormControl, FormField, FormItem } from "../ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { promptSchema, TPromptSchema } from "@/lib/types";
import { langchain2, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default function PromptForm() {
	const [answer, setAnswer] = useState("");
	const [data, setData] = useState<langchain2 | null>(null);

	const form = useForm<TPromptSchema>({
		resolver: zodResolver(promptSchema),
		defaultValues: {
			prompt: "",
		},
	});

	const onSubmit = async (data: TPromptSchema) => {
		setAnswer("");
		const res = await fetch("/api/chat", {
			method: "POST",
			body: JSON.stringify({
				prompt: data.prompt,
			}),
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (res.ok && res.body) {
			const reader = res.body.getReader();
			const decoder = new TextDecoder();
			let done = false;

			while (!done) {
				const { value, done: readerDone } = await reader.read();
				done = readerDone;

				if (value) {
					const chunk = decoder.decode(value, { stream: true });
					setAnswer((prev) => prev + chunk);
				}
			}
		}
	};

	return (
		<div className="flex flex-col gap-4 max-w-3xl w-full items-center justify-center">
			<p>{answer && answer}</p>

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
									<Input autoFocus {...field} />
								</FormControl>
							</FormItem>
						)}
					/>
					<Button
						variant="expandIcon"
						Icon={IconCircleArrowUp}
						iconPlacement="right"
						type="submit"
						disabled={!form.formState.isDirty}
					>
						Submit
					</Button>
				</form>
			</Form>
			<p className="text-rose-600">
				{form.formState.errors.prompt?.message}
			</p>

			<div className="flex items-center gap-4">
				<p>Test DB</p>
				<form
					action={async () => {
						const id = "01124963-ca79-4ff5-90eb-2882783075b5";
						const res = await prisma.langchain2.findUnique({
							where: { id: id },
						});
						setData(res);
					}}
				>
					<Button>Get Values</Button>
				</form>
			</div>
		</div>
	);
}
