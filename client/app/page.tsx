import PromptForm from "@/components/custom/PromptForm";
import { Button } from "@/components/ui/newbutton";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default function Page() {


	return (
		<div className="flex flex-col items-center w-full">
			<PromptForm />
		</div>
	);
}
