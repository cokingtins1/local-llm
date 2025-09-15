import { traceable } from "langsmith/traceable";
import { initializePrismaDB } from "../initializePrismaDB";
import { ChatOllama } from "@langchain/ollama";
import { chatModel } from "@/MODELS";
import { Client } from "langsmith";
import { evaluate, type EvaluationResult } from "langsmith/evaluation";
import { ChatAnthropic } from "@langchain/anthropic";

import { z } from "zod";

const llm = new ChatOllama({
	model: chatModel,
	temperature: 0,
	maxRetries: 2,
	baseUrl: process.env.OLLAMA_URL || "http://localhost:11434",
});

const ragBot = traceable(async (prompt: string) => {
	const db = await initializePrismaDB();
	const retrievedDocs = await db.similaritySearch(prompt);
	const docsContent = retrievedDocs.map((doc) => doc.pageContent).join("");

	const instructions = `You are a helpful assistant who is good at analyzing source information and answering questions
        Use the following source documents to answer the user's questions.
        If you don't know the answer, just say that you don't know.
        Use three sentences maximum and keep the answer concise.
        Documents:
        ${docsContent}`;

	const aiMsg = await llm.invoke([
		{
			role: "system",
			content: instructions,
		},
		{
			role: "user",
			content: prompt,
		},
	]);

	return { answer: aiMsg.content, documents: retrievedDocs };
});
const client = new Client();

const examples = [
	// 03_15_10_00 - CONCRETE ANCHORAGE

	[
		"How should anchors in the underside of concrete over metal deck be installed?",
		"Anchors in the underside of concrete over metal deck should be installed in the bottom flute only ",
	],

	[
		"What type of hundercut concrete anchors are permitted?",
		"HDA (ESR-1546 and ETA-99/0009) by Hilti Corporation, Atomic+ (ESR-3067) or Mini-Undercut+ (ESR-3912) by DeWalt or Torq-Cut (ESR-2705) by Simpson StrongTie Company are the permitted concrete anchor types",
	],

	[
		"What are the requirements for wire pulling tension calculations?",
		"Wire pulling tension calculations are described in Sections 26_05_13_00 and 26_05_19_00 ",
	],
	// 26_05_33_31 - CONDUIT
	[
		"Are moisture traps permitted in electrical conduit installations?",
		"Moisture traps should be avoided where possible, but when unavoidable,  provide condulets or junction boxes with drain fittings at conduit low points where required to limit water ingress into equipment ",
	],

	[
		"What is the minimum burial depth for underground conduits?",
		"The minimum burial depth of underground conduits is 2 feet (600mm) or unless otherwise required by code",
	],

	// 23_31_13_01(15811) - METAL HVAC DUCTWORK AND ACCESSORIES

	[
		"What is the maximum spacing allowed for duct hangers?",
		"Hanger spacing intervals shall not exceed the specified maximums indicated on drawing details. If not specified, spacing shall not exceed the spacing listed in SMACNA",
	],

	[
		"Is Duck Tape an acceptable manufacturer of duct tape?",
		"The acceptable manufacturers of duct tape are 3M Scotchwrap No. 50 vinyl for cleanroom applications, and NASHUA No. 324A aluminum tape for non-cleanroom applications",
	],
];

const [inputs, outputs] = examples.reduce<
	[Array<{ input: string }>, Array<{ outputs: string }>]
>(
	([inputs, outputs], item) => [
		[...inputs, { input: item[0] }],
		[...outputs, { outputs: item[1] }],
	],
	[[], []]
);

const datasetName = "Spec Questions 1";

async function createDataset() {
	const dataset = await client.createDataset(datasetName);
	await client.createExamples({ inputs, outputs, datasetId: dataset.id });
	console.log("Dataset created successfully");
}

// Run dataset creation first, then evaluation
async function main() {
	try {
		console.log("Creating dataset...");
		await createDataset();
		console.log("Running evaluation...");
		await runEvaluation();
	} catch (error) {
		console.error("Evaluation failed:", error);
	}
}

// Uncomment the line below to run the evaluation
// main();

// Grade prompt
const correctnessInstructions = `You are a teacher grading a quiz. You will be given a QUESTION, the GROUND TRUTH (correct) ANSWER, and the STUDENT ANSWER. Here is the grade criteria to follow:
(1) Grade the student answers based ONLY on their factual accuracy relative to the ground truth answer. (2) Ensure that the student answer does not contain any conflicting statements.
(3) It is OK if the student answer contains more information than the ground truth answer, as long as it is factually accurate relative to the  ground truth answer.

Correctness:
A correctness value of True means that the student's answer meets all of the criteria.
A correctness value of False means that the student's answer does not meet all of the criteria.

Explain your reasoning in a step-by-step manner to ensure your reasoning and conclusion are correct. Avoid simply stating the correct answer at the outset.`;

const graderLLM = new ChatAnthropic({
	model: "claude-sonnet-4-0",
	temperature: 0,
}).withStructuredOutput(
	z
		.object({
			explanation: z
				.string()
				.describe("Explain your reasoning for the score"),
			correct: z
				.boolean()
				.describe("True if the answer is correct, False otherwise."),
		})
		.describe(
			"Correctness score for reference answer v.s. generated answer."
		)
);

async function correctness({
	inputs,
	outputs,
	referenceOutputs,
}: {
	inputs: Record<string, any>;
	outputs: Record<string, any>;
	referenceOutputs?: Record<string, any>;
}): Promise<EvaluationResult> {
	const answer = `QUESTION: ${inputs.question}
    GROUND TRUTH ANSWER: ${referenceOutputs?.answer}
    STUDENT ANSWER: ${outputs.answer}`;

	// Run evaluator
	const grade = await graderLLM.invoke([
		{ role: "system", content: correctnessInstructions },
		{ role: "user", content: answer },
	]);
	return { key: "correctness", score: grade.correct };
}

// Grade prompt
const relevanceInstructions = `You are a teacher grading a quiz. You will be given a QUESTION and a STUDENT ANSWER. Here is the grade criteria to follow:
(1) Ensure the STUDENT ANSWER is concise and relevant to the QUESTION
(2) Ensure the STUDENT ANSWER helps to answer the QUESTION

Relevance:
A relevance value of True means that the student's answer meets all of the criteria.
A relevance value of False means that the student's answer does not meet all of the criteria.

Explain your reasoning in a step-by-step manner to ensure your reasoning and conclusion are correct. Avoid simply stating the correct answer at the outset.`;

const relevanceLLM = new ChatAnthropic({
	model: "claude-sonnet-4-0",
	temperature: 0,
}).withStructuredOutput(
	z
		.object({
			explanation: z
				.string()
				.describe("Explain your reasoning for the score"),
			relevant: z
				.boolean()
				.describe(
					"Provide the score on whether the answer addresses the question"
				),
		})
		.describe("Relevance score for generated answer v.s. input question.")
);

async function relevance({
	inputs,
	outputs,
}: {
	inputs: Record<string, any>;
	outputs: Record<string, any>;
}): Promise<EvaluationResult> {
	const answer = `QUESTION: ${inputs.question}
STUDENT ANSWER: ${outputs.answer}`;

	// Run evaluator
	const grade = await relevanceLLM.invoke([
		{ role: "system", content: relevanceInstructions },
		{ role: "user", content: answer },
	]);
	return { key: "relevance", score: grade.relevant };
}

// Grade prompt
const groundedInstructions = `You are a teacher grading a quiz. You will be given FACTS and a STUDENT ANSWER. Here is the grade criteria to follow:
(1) Ensure the STUDENT ANSWER is grounded in the FACTS. (2) Ensure the STUDENT ANSWER does not contain "hallucinated" information outside the scope of the FACTS.

Grounded:
A grounded value of True means that the student's answer meets all of the criteria.
A grounded value of False means that the student's answer does not meet all of the criteria.

Explain your reasoning in a step-by-step manner to ensure your reasoning and conclusion are correct. Avoid simply stating the correct answer at the outset.`;

const groundedLLM = new ChatAnthropic({
	model: "claude-sonnet-4-0",
	temperature: 0,
}).withStructuredOutput(
	z
		.object({
			explanation: z
				.string()
				.describe("Explain your reasoning for the score"),
			grounded: z
				.boolean()
				.describe(
					"Provide the score on if the answer hallucinates from the documents"
				),
		})
		.describe("Grounded score for the answer from the retrieved documents.")
);

async function grounded({
	inputs,
	outputs,
}: {
	inputs: Record<string, any>;
	outputs: Record<string, any>;
}): Promise<EvaluationResult> {
	const docString = outputs.documents
		.map((doc: any) => doc.pageContent)
		.join("");
	const answer = `FACTS: ${docString}
    STUDENT ANSWER: ${outputs.answer}`;

	// Run evaluator
	const grade = await groundedLLM.invoke([
		{ role: "system", content: groundedInstructions },
		{ role: "user", content: answer },
	]);
	return { key: "grounded", score: grade.grounded };
}

// Grade prompt
const retrievalRelevanceInstructions = `You are a teacher grading a quiz. You will be given a QUESTION and a set of FACTS provided by the student. Here is the grade criteria to follow:
(1) You goal is to identify FACTS that are completely unrelated to the QUESTION
(2) If the facts contain ANY keywords or semantic meaning related to the question, consider them relevant
(3) It is OK if the facts have SOME information that is unrelated to the question as long as (2) is met

Relevance:
A relevance value of True means that the FACTS contain ANY keywords or semantic meaning related to the QUESTION and are therefore relevant.
A relevance value of False means that the FACTS are completely unrelated to the QUESTION.

Explain your reasoning in a step-by-step manner to ensure your reasoning and conclusion are correct. Avoid simply stating the correct answer at the outset.`;

const retrievalRelevanceLLM = new ChatAnthropic({
	model: "claude-sonnet-4-0",
	temperature: 0,
}).withStructuredOutput(
	z
		.object({
			explanation: z
				.string()
				.describe("Explain your reasoning for the score"),
			relevant: z
				.boolean()
				.describe(
					"True if the retrieved documents are relevant to the question, False otherwise"
				),
		})
		.describe(
			"Retrieval relevance score for the retrieved documents v.s. the question."
		)
);

async function retrievalRelevance({
	inputs,
	outputs,
}: {
	inputs: Record<string, any>;
	outputs: Record<string, any>;
}): Promise<EvaluationResult> {
	const docString = outputs.documents
		.map((doc: any) => doc.pageContent)
		.join("");
	const answer = `FACTS: ${docString}
    QUESTION: ${inputs.question}`;

	// Run evaluator
	const grade = await retrievalRelevanceLLM.invoke([
		{ role: "system", content: retrievalRelevanceInstructions },
		{ role: "user", content: answer },
	]);
	return { key: "retrievalRelevance", score: grade.relevant };
}

const targetFunc = (inputs: Record<string, any>) => {
	return ragBot(inputs.question);
};

async function runEvaluation() {
	const experimentResults = await evaluate(targetFunc, {
		data: datasetName,
		evaluators: [correctness, grounded, relevance, retrievalRelevance],
		experimentPrefix: "rag-doc-relevance",
		metadata: { version: "LCEL context, gpt-4-0125-preview" },
	});
	console.log("Evaluation completed:", experimentResults);
}
