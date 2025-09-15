import { NextResponse } from "next/server";
import updatePrismaDB from "@/app/actions/updatePrismaDB";

export async function GET() {
	try {
		console.log("🔄 Starting document processing...");
		await updatePrismaDB();
		console.log("✅ Document processing completed");
		
		return NextResponse.json({ 
			message: "Documents processed successfully",
			status: "success" 
		});
	} catch (error) {
		console.error("❌ Error processing documents:", error);
		
		return NextResponse.json(
			{ 
				message: "Error processing documents",
				status: "error",
				error: error instanceof Error ? error.message : "Unknown error"
			},
			{ status: 500 }
		);
	}
}