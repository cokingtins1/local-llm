import PromptForm from "@/components/custom/PromptForm";
import { Button } from "@/components/ui/newbutton";
import { PrismaClient } from "@prisma/client";

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
						// const res = await prisma.prismaLangChain.findMany({
						// 	select: { id: true, chunkId: true, metadata: true },
						// });

						await prisma.prismaLangChain.deleteMany({});
						await prisma.prismaLangChain.findFirst({where: {}})

						// console.dir(
						// 	res.map((item) => item.chunkId),
						// 	{ maxArrayLength: null }
						// );
					}}
				>
					<Button>Delete Data</Button>
				</form>
			</div>
		</div>
	);
}
