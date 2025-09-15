import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { BrowserbaseLoader } from "@langchain/community/document_loaders/web/browserbase";
import { traceable } from "langsmith/traceable";
import { Client } from "langsmith";
import { evaluate, type EvaluationResult } from "langsmith/evaluation";
import { z } from "zod";

// List of URLs to load documents from
const urls = [
    "https://lilianweng.github.io/posts/2023-06-23-agent/",
    "https://lilianweng.github.io/posts/2023-03-15-prompt-engineering/",
    "https://lilianweng.github.io/posts/2023-10-25-adv-attack-llm/",
]

const loader = new BrowserbaseLoader(urls, {
    textContent: true,
});

const docs = await loader.load();

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000, chunkOverlap: 200
});

const allSplits = await splitter.splitDocuments(docs);

const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large"
});

const vectorStore = new MemoryVectorStore(embeddings);  // Index chunks
await vectorStore.addDocuments(allSplits)

const llm = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 1,
})

// Add decorator so this function is traced in LangSmith
const ragBot = traceable(
    async (question: string) => {
        // LangChain retriever will be automatically traced
        const retrievedDocs = await vectorStore.similaritySearch(question);
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
                content: instructions
            },
            {
                role: "user",
                content: question
            }
        ])

        return {"answer": aiMsg.content, "documents": retrievedDocs}
    }
)

const client = new Client();

// Define the examples for the dataset
const examples = [
    [
        "How does the ReAct agent use self-reflection? ",
        "ReAct integrates reasoning and acting, performing actions - such tools like Wikipedia search API - and then observing / reasoning about the tool outputs.",
    ],
    [
        "What are the types of biases that can arise with few-shot prompting?",
        "The biases that can arise with few-shot prompting include (1) Majority label bias, (2) Recency bias, and (3) Common token bias.",
    ],
    [
        "What are five types of adversarial attacks?",
        "Five types of adversarial attacks are (1) Token manipulation, (2) Gradient based attack, (3) Jailbreak prompting, (4) Human red-teaming, (5) Model red-teaming.",
    ]
]

const [inputs, outputs] = examples.reduce<[Array<{ input: string }>, Array<{ outputs: string }>]>(
    ([inputs, outputs], item) => [
        [...inputs, { input: item[0] }],
        [...outputs, { outputs: item[1] }],
    ],
    [[], []]
);

const datasetName = "Lilian Weng Blogs Q&A";
const dataset = await client.createDataset(datasetName);
await client.createExamples({ inputs, outputs, datasetId: dataset.id })

// Grade prompt
const correctnessInstructions = `You are a teacher grading a quiz. You will be given a QUESTION, the GROUND TRUTH (correct) ANSWER, and the STUDENT ANSWER. Here is the grade criteria to follow:
(1) Grade the student answers based ONLY on their factual accuracy relative to the ground truth answer. (2) Ensure that the student answer does not contain any conflicting statements.
(3) It is OK if the student answer contains more information than the ground truth answer, as long as it is factually accurate relative to the  ground truth answer.

Correctness:
A correctness value of True means that the student's answer meets all of the criteria.
A correctness value of False means that the student's answer does not meet all of the criteria.

Explain your reasoning in a step-by-step manner to ensure your reasoning and conclusion are correct. Avoid simply stating the correct answer at the outset.`

const graderLLM = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0,
}).withStructuredOutput(
  z
    .object({
      explanation: z
        .string()
        .describe("Explain your reasoning for the score"),
      correct: z
        .boolean()
        .describe("True if the answer is correct, False otherwise.")
    })
    .describe("Correctness score for reference answer v.s. generated answer.")
);

async function correctness({
  inputs,
  outputs,
  referenceOutputs,
}: {
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  referenceOutputs?: Record<string, any>;
}): Promise<EvaluationResult> => {
  const answer = `QUESTION: ${inputs.question}
    GROUND TRUTH ANSWER: ${referenceOutputs.answer}
    STUDENT ANSWER: ${outputs.answer}`

  // Run evaluator
  const grade = graderLLM.invoke([{role: "system", content: correctnessInstructions}, {role: "user", content: answer}])
  return grade.score;
};

// Grade prompt
const relevanceInstructions = `You are a teacher grading a quiz. You will be given a QUESTION and a STUDENT ANSWER. Here is the grade criteria to follow:
(1) Ensure the STUDENT ANSWER is concise and relevant to the QUESTION
(2) Ensure the STUDENT ANSWER helps to answer the QUESTION

Relevance:
A relevance value of True means that the student's answer meets all of the criteria.
A relevance value of False means that the student's answer does not meet all of the criteria.

Explain your reasoning in a step-by-step manner to ensure your reasoning and conclusion are correct. Avoid simply stating the correct answer at the outset.`

const relevanceLLM = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0,
}).withStructuredOutput(
  z
    .object({
      explanation: z
        .string()
        .describe("Explain your reasoning for the score"),
      relevant: z
        .boolean()
        .describe("Provide the score on whether the answer addresses the question")
    })
    .describe("Relevance score for generated answer v.s. input question.")
);

async function relevance({
  inputs,
  outputs,
}: {
  inputs: Record<string, any>;
  outputs: Record<string, any>;
}): Promise<EvaluationResult> => {
  const answer = `QUESTION: ${inputs.question}
STUDENT ANSWER: ${outputs.answer}`

  // Run evaluator
  const grade = relevanceLLM.invoke([{role: "system", content: relevanceInstructions}, {role: "user", content: answer}])
  return grade.relevant;
};

// Grade prompt
const groundedInstructions = `You are a teacher grading a quiz. You will be given FACTS and a STUDENT ANSWER. Here is the grade criteria to follow:
(1) Ensure the STUDENT ANSWER is grounded in the FACTS. (2) Ensure the STUDENT ANSWER does not contain "hallucinated" information outside the scope of the FACTS.

Grounded:
A grounded value of True means that the student's answer meets all of the criteria.
A grounded value of False means that the student's answer does not meet all of the criteria.

Explain your reasoning in a step-by-step manner to ensure your reasoning and conclusion are correct. Avoid simply stating the correct answer at the outset.`

const groundedLLM = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0,
}).withStructuredOutput(
  z
    .object({
      explanation: z
        .string()
        .describe("Explain your reasoning for the score"),
      grounded: z
        .boolean()
        .describe("Provide the score on if the answer hallucinates from the documents")
    })
    .describe("Grounded score for the answer from the retrieved documents.")
);

async function grounded({
  inputs,
  outputs,
}: {
  inputs: Record<string, any>;
  outputs: Record<string, any>;
}): Promise<EvaluationResult> => {
  const docString = outputs.documents.map((doc) => doc.pageContent).join("");
  const answer = `FACTS: ${docString}
    STUDENT ANSWER: ${outputs.answer}`

  // Run evaluator
  const grade = groundedLLM.invoke([{role: "system", content: groundedInstructions}, {role: "user", content: answer}])
  return grade.grounded;
};

// Grade prompt
const retrievalRelevanceInstructions = `You are a teacher grading a quiz. You will be given a QUESTION and a set of FACTS provided by the student. Here is the grade criteria to follow:
(1) You goal is to identify FACTS that are completely unrelated to the QUESTION
(2) If the facts contain ANY keywords or semantic meaning related to the question, consider them relevant
(3) It is OK if the facts have SOME information that is unrelated to the question as long as (2) is met

Relevance:
A relevance value of True means that the FACTS contain ANY keywords or semantic meaning related to the QUESTION and are therefore relevant.
A relevance value of False means that the FACTS are completely unrelated to the QUESTION.

Explain your reasoning in a step-by-step manner to ensure your reasoning and conclusion are correct. Avoid simply stating the correct answer at the outset.`

const retrievalRelevanceLLM = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0,
}).withStructuredOutput(
  z
    .object({
      explanation: z
        .string()
        .describe("Explain your reasoning for the score"),
      relevant: z
        .boolean()
        .describe("True if the retrieved documents are relevant to the question, False otherwise")
    })
    .describe("Retrieval relevance score for the retrieved documents v.s. the question.")
);

async function retrievalRelevance({
  inputs,
  outputs,
}: {
  inputs: Record<string, any>;
  outputs: Record<string, any>;
}): Promise<EvaluationResult> => {
  const docString = outputs.documents.map((doc) => doc.pageContent).join("");
  const answer = `FACTS: ${docString}
    QUESTION: ${inputs.question}`

  // Run evaluator
  const grade = retrievalRelevanceLLM.invoke([{role: "system", content: retrievalRelevanceInstructions}, {role: "user", content: answer}])
  return grade.relevant;
};

const targetFunc = (inputs: Record<string, any>) => {
    return ragBot(inputs.question)
};

const experimentResults = await evaluate(targetFunc, {
    data: datasetName,
    evaluators: [correctness, groundedness, relevance, retrievalRelevance],
    experimentPrefix: "rag-doc-relevance",
    metadata: {version: "LCEL context, gpt-4-0125-preview"},
});