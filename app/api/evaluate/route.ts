import { NextRequest, NextResponse } from "next/server";

const RAGAS_SERVICE_URL =
	process.env.RAGAS_SERVICE_URL || "http://localhost:8000";

const questions = [
	"What hand wins in Texas Holdem, a flush or a full house?",
	"How much money do you collect for passing Go in Monopoly?",
];

const groundTruths = ["A full house wins", "You collect $200 for passing Go"];

export async function POST(request: NextRequest) {
	try {
		// const body = await request.json();
		const body = {
			questions,
			ground_truths: groundTruths,
			use_existing_rag: true,
		};

		console.log("body: ", body);

		const response = await fetch(`${RAGAS_SERVICE_URL}/evaluate`, {
			// method: "POST",
			// headers: {
			// 	"Content-Type": "application/json",
			// },
			// body: JSON.stringify(body),

			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const errorData = await response.json();
			return NextResponse.json(
				{ error: errorData.detail || "Evaluation failed" },
				{ status: response.status }
			);
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Evaluation API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function GET() {
	try {
		const response = await fetch(`${RAGAS_SERVICE_URL}/health`);
		const data = await response.json();

		return NextResponse.json({
			status: "healthy",
			ragas_service: data,
			service_url: RAGAS_SERVICE_URL,
		});
	} catch (error) {
		return NextResponse.json(
			{
				status: "unhealthy",
				error: "Cannot connect to Ragas service",
				service_url: RAGAS_SERVICE_URL,
			},
			{ status: 503 }
		);
	}
}
