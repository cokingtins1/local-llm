"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, PlayCircle, FileText, BarChart3 } from "lucide-react";

interface EvaluationResult {
	evaluation_id: string;
	results: any[];
	metrics: Record<string, number>;
	status: string;
}

interface TestData {
	questions: string[];
	contexts: string[][];
	ground_truths: string[];
	metadata: {
		generated_count: number;
		source_documents: number;
	};
}

export default function EvaluatePage() {
	const [isEvaluating, setIsEvaluating] = useState(false);
	const [isGeneratingTestData, setIsGeneratingTestData] = useState(false);
	const [evaluationResult, setEvaluationResult] =
		useState<EvaluationResult | null>(null);
	const [testData, setTestData] = useState<TestData | null>(null);
	const [questions, setQuestions] = useState("");
	const [groundTruths, setGroundTruths] = useState("");
	const [numTestQuestions, setNumTestQuestions] = useState(5);
	const [serviceStatus, setServiceStatus] = useState<string>("unknown");

	const checkServiceHealth = async () => {
		try {
			const response = await fetch("/api/evaluate");
			const data = await response.json();
			setServiceStatus(
				data.status === "healthy" ? "healthy" : "unhealthy"
			);
		} catch (error) {
			setServiceStatus("unhealthy");
		}
	};

	const generateTestData = async () => {
		setIsGeneratingTestData(true);
		try {
			const response = await fetch("/api/evaluate/test-data", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ num_questions: numTestQuestions }),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			setTestData(data.data);

			// Auto-fill the questions and ground truths
			setQuestions(data.data.questions.join("\n"));
			setGroundTruths(data.data.ground_truths.join("\n"));
		} catch (error) {
			console.error("Failed to generate test data:", error);
			alert("Failed to generate test data. Please try again.");
		} finally {
			setIsGeneratingTestData(false);
		}
	};

	const runEvaluation = async () => {
		const questionList = questions
			.trim()
			.split("\n")
			.filter((q) => q.trim());
		const groundTruthList = groundTruths.trim()
			? groundTruths
					.trim()
					.split("\n")
					.filter((gt) => gt.trim())
			: undefined;

		if (questionList.length === 0) {
			alert("Please provide at least one question.");
			return;
		}

		if (groundTruthList && groundTruthList.length !== questionList.length) {
			alert("Number of ground truths must match number of questions.");
			return;
		}

		setIsEvaluating(true);

		console.log("questionList: ", questionList);
		console.log("groundTruthList: ", groundTruthList);
		try {
			const response = await fetch("/api/evaluate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					questions: questionList,
					ground_truths: groundTruthList,
					use_existing_rag: true,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error || `HTTP error! status: ${response.status}`
				);
			}

			const result = await response.json();
			setEvaluationResult(result);
		} catch (error) {
			console.error("Evaluation failed:", error);
			alert(
				`Evaluation failed: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		} finally {
			setIsEvaluating(false);
		}
	};

	// Format metric values for display
	const formatMetric = (value: number): string => {
		return (value * 100).toFixed(1) + "%";
	};

	const getMetricColor = (value: number): string => {
		if (value >= 0.8) return "bg-green-100 text-green-800";
		if (value >= 0.6) return "bg-yellow-100 text-yellow-800";
		return "bg-red-100 text-red-800";
	};

	return (
		<div className="container mx-auto p-6 max-w-6xl">
			<div className="mb-6">
				<h1 className="text-3xl font-bold mb-2">
					RAG Evaluation Dashboard
				</h1>
				<p className="text-gray-600">
					Evaluate your RAG pipeline using the Ragas framework
				</p>
				<div className="mt-4 flex items-center gap-4">
					<Button
						variant="outline"
						size="sm"
						onClick={checkServiceHealth}
					>
						Check Service Health
					</Button>
					<Badge
						variant={
							serviceStatus === "healthy"
								? "default"
								: "destructive"
						}
					>
						Service: {serviceStatus}
					</Badge>
				</div>
			</div>

			<Tabs defaultValue="evaluate" className="space-y-6">
				<TabsList>
					<TabsTrigger value="evaluate">
						<BarChart3 className="w-4 h-4 mr-2" />
						Evaluate
					</TabsTrigger>
					<TabsTrigger value="test-data">
						<FileText className="w-4 h-4 mr-2" />
						Generate Test Data
					</TabsTrigger>
				</TabsList>

				<TabsContent value="test-data">
					<Card>
						<CardHeader>
							<CardTitle>Generate Test Data</CardTitle>
							<CardDescription>
								Generate synthetic questions and ground truth
								answers from your existing documents
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<Label htmlFor="num-questions">
									Number of Test Questions
								</Label>
								<Input
									id="num-questions"
									type="number"
									min="1"
									max="50"
									value={numTestQuestions}
									onChange={(e) =>
										setNumTestQuestions(
											Number(e.target.value)
										)
									}
									className="w-32"
								/>
							</div>
							<Button
								onClick={generateTestData}
								disabled={isGeneratingTestData}
								className="w-full"
							>
								{isGeneratingTestData ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Generating...
									</>
								) : (
									<>
										<FileText className="mr-2 h-4 w-4" />
										Generate Test Data
									</>
								)}
							</Button>

							{testData && (
								<div className="mt-4 p-4 bg-gray-50 rounded-lg">
									<h4 className="font-medium mb-2">
										Generated Test Data:
									</h4>
									<div className="text-sm text-gray-600">
										<p>
											Questions:{" "}
											{testData.metadata.generated_count}
										</p>
										<p>
											Source Documents:{" "}
											{testData.metadata.source_documents}
										</p>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="evaluate">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Input Section */}
						<Card>
							<CardHeader>
								<CardTitle>Evaluation Input</CardTitle>
								<CardDescription>
									Enter questions to evaluate your RAG
									pipeline
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<Label htmlFor="questions">
										Questions (one per line)
									</Label>
									<textarea
										id="questions"
										className="w-full h-32 p-2 border rounded-md resize-none text-black"
										placeholder="What is the main topic of the document?&#10;How does the system handle errors?&#10;What are the key features?"
										value={questions}
										onChange={(e) =>
											setQuestions(e.target.value)
										}
									/>
								</div>
								<div>
									<Label htmlFor="ground-truths">
										Ground Truth Answers (optional, one per
										line)
									</Label>
									<textarea
										id="ground-truths"
										className="w-full h-32 p-2 border rounded-md resize-none text-black"
										placeholder="The document discusses machine learning...&#10;The system uses try-catch blocks...&#10;Key features include real-time processing..."
										value={groundTruths}
										onChange={(e) =>
											setGroundTruths(e.target.value)
										}
									/>
								</div>
								<Button
									onClick={runEvaluation}
									disabled={isEvaluating || !questions.trim()}
									className="w-full"
								>
									{isEvaluating ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Evaluating...
										</>
									) : (
										<>
											<PlayCircle className="mr-2 h-4 w-4" />
											Run Evaluation
										</>
									)}
								</Button>
							</CardContent>
						</Card>

						{/* Results Section */}
						<Card>
							<CardHeader>
								<CardTitle>Evaluation Results</CardTitle>
								<CardDescription>
									Ragas evaluation metrics and scores
								</CardDescription>
							</CardHeader>
							<CardContent>
								{!evaluationResult ? (
									<div className="text-center py-8 text-gray-500">
										Run an evaluation to see results here
									</div>
								) : (
									<div className="space-y-4">
										<div className="text-sm text-gray-600 mb-4">
											Evaluation ID:{" "}
											{evaluationResult.evaluation_id}
										</div>

										{/* Metrics Grid */}
										<div className="grid grid-cols-2 gap-3">
											{Object.entries(
												evaluationResult.metrics
											).map(([metric, value]) => (
												<div
													key={metric}
													className={`p-3 rounded-lg border ${getMetricColor(
														value as number
													)}`}
												>
													<div className="text-sm font-medium capitalize">
														{metric.replace(
															/_/g,
															" "
														)}
													</div>
													<div className="text-lg font-bold">
														{formatMetric(
															value as number
														)}
													</div>
												</div>
											))}
										</div>

										{/* Detailed Results */}
										{evaluationResult.results &&
											evaluationResult.results.length >
												0 && (
												<div className="mt-6">
													<h4 className="font-medium mb-2">
														Detailed Results:
													</h4>
													<div className="max-h-64 overflow-y-auto space-y-2">
														{evaluationResult.results.map(
															(result, index) => (
																<div
																	key={index}
																	className="p-2 bg-gray-50 rounded text-sm"
																>
																	<div className="font-medium">
																		Question{" "}
																		{index +
																			1}
																	</div>
																	<div className="text-gray-600 text-xs">
																		{Object.entries(
																			result
																		).map(
																			([
																				key,
																				val,
																			]) => (
																				<span
																					key={
																						key
																					}
																					className="mr-3"
																				>
																					{
																						key
																					}

																					:{" "}
																					{typeof val ===
																					"number"
																						? formatMetric(
																								val
																						  )
																						: String(
																								val
																						  ).slice(
																								0,
																								50
																						  )}
																				</span>
																			)
																		)}
																	</div>
																</div>
															)
														)}
													</div>
												</div>
											)}
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
