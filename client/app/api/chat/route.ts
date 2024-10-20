import queryDB from "@/app/actions/queryDB";
import updatePrismaDB from "@/app/actions/updatePrismaDB";
import { promptSchema } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
	const body = await req.json();

	const result = promptSchema.safeParse(body);
	let zodErrors = {};

	if (!result.success) {
		result.error.issues.forEach((issue) => {
			zodErrors = { ...zodErrors, [issue.path[0]]: issue.message };
		});

		return NextResponse.json(
			Object.keys(zodErrors).length > 0
				? { errors: zodErrors }
				: { success: { data: "data..." } }
		);
	}

	const { prompt } = result.data;

	await updatePrismaDB();
	const stream = await queryDB(prompt);

	return new NextResponse(stream, {
		headers: { "Content-Type": "text/plain" },
	});

	// return NextResponse.json({ message: "success" });
}
