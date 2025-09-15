# import os
# import asyncio
# import uuid
# from typing import List, Dict, Any, Optional
# import requests
# # No datasets import needed

# from ragas import evaluate
# from ragas.metrics import (
#     faithfulness,
#     answer_relevancy,
#     context_precision,
#     context_recall
# )
# from datasets import Dataset

# from langchain_ollama import ChatOllama

# class SimpleRAGEvaluator:
#     def __init__(self):
#         self.ollama_url = os.getenv("OLLAMA_URL", "http://ollama:11434")
#         self.chat_model_name = os.getenv("CHAT_MODEL", "gemma2:2b")
#         self.nextjs_url = os.getenv("NEXTJS_URL", "http://client:3000")
        
#         # Initialize chat model for Ragas
#         self.chat_model = ChatOllama(
#             base_url=self.ollama_url,
#             model=self.chat_model_name,
#             temperature=0
#         )
        
#         # Configure Ragas metrics
#         self.metrics = [
#             faithfulness,
#             answer_relevancy,
#             context_precision,
#             context_recall
#         ]
        
#         # Set the LLM for metrics that need it
#         for metric in self.metrics:
#             if hasattr(metric, 'llm'):
#                 metric.llm = self.chat_model
#             if hasattr(metric, 'embeddings') and hasattr(metric, 'llm'):
#                 # Some metrics need both LLM and embeddings configured
#                 try:
#                     metric.init(llm=self.chat_model)
#                 except:
#                     pass

#     async def get_rag_response(self, question: str) -> Dict[str, Any]:
#         """Get response from your existing Next.js RAG endpoint"""
#         try:
#             # Call your existing queryDB function via your Next.js API
#             response = requests.post(
#                 f"{self.nextjs_url}/api/chat",
#                 json={"message": question},
#                 timeout=30
#             )
            
#             if response.status_code == 200:
#                 # Parse the streaming response to get the final answer
#                 answer = ""
#                 for line in response.iter_lines():
#                     if line:
#                         answer += line.decode('utf-8')
                
#                 return {
#                     "answer": answer.strip(),
#                     "contexts": ["Retrieved from your existing RAG system"]  # Simplified
#                 }
#             else:
#                 raise Exception(f"API call failed with status {response.status_code}")
                
#         except Exception as e:
#             raise Exception(f"Error getting RAG response: {str(e)}")

#     async def evaluate_simple(
#         self, 
#         questions: List[str], 
#         ground_truths: Optional[List[str]] = None
#     ) -> Dict[str, Any]:
#         """Simple evaluation using existing RAG system"""
        
#         evaluation_id = str(uuid.uuid4())
        
#         # Get responses from your existing RAG
#         dataset_list = []
        
#         for i, question in enumerate(questions):
#             try:
#                 rag_response = await self.get_rag_response(question)
                
#                 eval_item = {
#                     "question": question,
#                     "answer": rag_response["answer"],
#                     "contexts": rag_response["contexts"]
#                 }
                
#                 if ground_truths and i < len(ground_truths):
#                     eval_item["ground_truth"] = ground_truths[i]
                
#                 dataset_list.append(eval_item)
                
#             except Exception as e:
#                 print(f"Error processing question {i}: {e}")
#                 continue
        
#         if not dataset_list:
#             raise Exception("No valid responses obtained from RAG system")
        
#         # Run Ragas evaluation with dataset list
#         result = evaluate(
#             dataset_list,
#             metrics=self.metrics
#         )
        
#         return {
#             "evaluation_id": evaluation_id,
#             "metrics": result.to_pandas().mean().to_dict(),
#             "detailed_results": result.to_pandas().to_dict('records'),
#             "dataset_info": {
#                 "num_questions": len(dataset_list),
#                 "has_ground_truth": ground_truths is not None
#             }
#         }

import os
import asyncio
import uuid
from typing import List, Dict, Any, Optional
import requests

from ragas import evaluate
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_precision,
    context_recall
)
from datasets import Dataset

from langchain_ollama import OllamaLLM
from langchain_ollama import OllamaLLM
from langchain_core.prompt_values import StringPromptValue

# -----------------------------
# Adapter to satisfy Ragas
# -----------------------------
class RagasCompatibleOllama:
    def __init__(self, model_name: str, base_url: str, temperature: float = 0):
        self.llm = OllamaLLM(
            model=model_name,
            base_url=base_url,
            temperature=temperature
        )

    def generate(self, **kwargs):
        prompt = kwargs.get("prompt") or kwargs.get("prompts")
        if isinstance(prompt, list):
            prompt = prompt[0]
        return self.llm(prompt)

    # Forward set_run_config to the underlying LLM
    def set_run_config(self, *args, **kwargs):
        if hasattr(self.llm, "set_run_config"):
            return self.llm.set_run_config(*args, **kwargs)
        # Otherwise, do nothing (or raise a warning)
        print("Warning: set_run_config not supported on this LLM version")


# -------------------------------
# Simple RAG Evaluator
# -------------------------------
class SimpleRAGEvaluator:
    def __init__(self):
        self.ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
        self.chat_model_name = os.getenv("CHAT_MODEL", "gemma2:2b")
        self.nextjs_url = os.getenv("NEXTJS_URL", "http://localhost:3000")

        # Use Ragas-compatible adapter
        self.chat_model = RagasCompatibleOllama(
            model_name=self.chat_model_name,
            base_url=self.ollama_url,
            temperature=0
        )

        # Ragas metrics
        self.metrics = [faithfulness, answer_relevancy, context_precision, context_recall]

        # Some metrics need llm set
        for metric in self.metrics:
            if hasattr(metric, "llm"):
                metric.llm = self.chat_model

    async def get_rag_response(self, question: str) -> Dict[str, Any]:
        """Get response from your existing Next.js RAG endpoint"""
        try:
            response = requests.post(
                f"{self.nextjs_url}/api/chat",
                json={"message": question},
                timeout=30
            )

            if response.status_code == 200:
                answer = ""
                for line in response.iter_lines():
                    if line:
                        answer += line.decode("utf-8")

                return {
                    "answer": answer.strip(),
                    "contexts": ["Retrieved from your existing RAG system"]
                }
            else:
                raise Exception(f"API call failed with status {response.status_code}")

        except Exception as e:
            raise Exception(f"Error getting RAG response: {str(e)}")

    async def evaluate_simple(
        self,
        questions: List[str],
        ground_truths: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        evaluation_id = str(uuid.uuid4())
        dataset_list = []

        for i, question in enumerate(questions):
            try:
                # Remove leading/trailing quotes and commas
                clean_question = question.strip().strip('"').strip(',')
                clean_ground_truth = None
                if ground_truths and i < len(ground_truths):
                    clean_ground_truth = ground_truths[i].strip().strip('"').strip(',')

                rag_response = await self.get_rag_response(clean_question)

                eval_item = {
                    "question": clean_question,
                    "answer": rag_response["answer"],
                    "contexts": rag_response["contexts"]
                }

                if clean_ground_truth:
                    eval_item["ground_truth"] = clean_ground_truth

                dataset_list.append(eval_item)

            except Exception as e:
                print(f"Error processing question {i}: {e}")
                continue

        if not dataset_list:
            raise Exception("No valid responses obtained from RAG system")

        # Run Ragas evaluation
        result = evaluate(dataset_list, metrics=self.metrics)

        return {
            "evaluation_id": evaluation_id,
            "metrics": result.to_pandas().mean().to_dict(),
            "detailed_results": result.to_pandas().to_dict("records"),
            "dataset_info": {
                "num_questions": len(dataset_list),
                "has_ground_truth": ground_truths is not None
            }
        }
