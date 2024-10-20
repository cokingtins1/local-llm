import PromptForm from "@/components/custom/PromptForm";
import { Button } from "@/components/ui/newbutton";
import { langchain2, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function Page() {
	return (
		<div className="flex flex-col items-center w-full">
			<PromptForm />

			<div className="flex items-center gap-4">
				<p>Test DB</p>
				<form
					action={async () => {
						"use server";
						const id = "01124963-ca79-4ff5-90eb-2882783075b5";
						const res = await prisma.langchain2.findUnique({
							where: { id: id },
						});

						const result = res as langchain2;
					}}
				>
					<Button>Get Values</Button>
				</form>
			</div>
		</div>
	);
}
