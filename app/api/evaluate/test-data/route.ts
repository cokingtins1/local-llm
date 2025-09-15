import { NextRequest, NextResponse } from "next/server";

const RAGAS_SERVICE_URL =
	process.env.RAGAS_SERVICE_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		console.log("body: ", body);

		const response = await fetch(
			`${RAGAS_SERVICE_URL}/generate-test-data`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			}
		);

		if (!response.ok) {
			const errorData = await response.json();
			return NextResponse.json(
				{ error: errorData.detail || "Test data generation failed" },
				{ status: response.status }
			);
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Test data generation API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function GET() {
	try {
		const response = await fetch(`${RAGAS_SERVICE_URL}/metrics/available`);
		const data = await response.json();

		return NextResponse.json(data);
	} catch (error) {
		return NextResponse.json(
			{ error: "Cannot fetch available metrics" },
			{ status: 503 }
		);
	}
}
