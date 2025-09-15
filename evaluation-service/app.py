from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv
import asyncio
import json
from evaluators.simple_rag_evaluator import SimpleRAGEvaluator

load_dotenv()

app = FastAPI(title="RAG Evaluation Service", version="1.0.0")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://client:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize evaluator
evaluator = SimpleRAGEvaluator()

class EvaluationRequest(BaseModel):
    questions: List[str]
    ground_truths: Optional[List[str]] = None
    contexts: Optional[List[List[str]]] = None
    answers: Optional[List[str]] = None
    use_existing_rag: bool = True

class EvaluationResponse(BaseModel):
    evaluation_id: str
    results: Dict[str, Any]
    metrics: Dict[str, float]
    status: str

class TestDataRequest(BaseModel):
    num_questions: int = 10
    context_sources: Optional[List[str]] = None

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "RAG Evaluation Service"}

@app.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_rag(request: EvaluationRequest):
    """
    Evaluate RAG pipeline using Ragas metrics
    """
    try:
        # Always use the simple evaluation approach
        results = await evaluator.evaluate_simple(
            questions=request.questions,
            ground_truths=request.ground_truths
        )
        
        return EvaluationResponse(
            evaluation_id=results["evaluation_id"],
            results=results["detailed_results"],
            metrics=results["metrics"],
            status="completed"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

@app.post("/generate-test-data")
async def generate_test_data(request: TestDataRequest):
    """
    Generate simple test data (placeholder - implement if needed)
    """
    # Simple hardcoded test questions for now
    sample_questions = [
        "What is the main topic discussed in the documents?",
        "How does the system work?",
        "What are the key features mentioned?",
        "What problems does this solve?",
        "What are the benefits described?"
    ][:request.num_questions]
    
    return {
        "status": "success", 
        "data": {
            "questions": sample_questions,
            "contexts": [[] for _ in sample_questions],
            "ground_truths": ["" for _ in sample_questions],
            "metadata": {
                "generated_count": len(sample_questions),
                "source_documents": 0
            }
        },
        "count": len(sample_questions)
    }

@app.get("/metrics/available")
async def get_available_metrics():
    """
    Get list of available evaluation metrics
    """
    return {
        "metrics": [
            {
                "name": "faithfulness",
                "description": "Measures factual accuracy of generated answers against retrieved context"
            },
            {
                "name": "answer_relevancy",
                "description": "Measures relevancy of generated response to the question"
            },
            {
                "name": "context_precision",
                "description": "Measures ranking of ground-truth relevant entities in context"
            },
            {
                "name": "context_recall",
                "description": "Measures extent to which retrieved context contains ground truth answer"
            },
            {
                "name": "context_relevancy",
                "description": "Measures relevancy of retrieved context to the question"
            }
        ]
    }

@app.get("/evaluation/{evaluation_id}")
async def get_evaluation_results(evaluation_id: str):
    """
    Get evaluation results by ID
    """
    try:
        results = await evaluator.get_evaluation_results(evaluation_id)
        return results
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Evaluation not found: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)