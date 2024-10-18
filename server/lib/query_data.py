from langchain_postgres import PGVector
from langchain_core.prompts import ChatPromptTemplate
from llama_cpp import Llama
from .get_embeddings import get_HF_embeddings
from langchain.llms import LlamaCpp
from langchain_core.callbacks import CallbackManager, StreamingStdOutCallbackHandler
from langchain_core.prompts import PromptTemplate

from llama_cpp import Llama


PROMPT_TEMPLATE = """
Answer the question based only on the following context:

{context}

---

Answer the question based on the above context: {question}
"""

MODEL_PATH = "C:/Users/cokin/OneDrive/Documents/GitHub/local-llm/server/models/capybarahermes-2.5-mistral-7b.Q4_K_M.gguf"


def load_model_gpu() -> LlamaCpp:
    callback_manager: CallbackManager = CallbackManager(
        [StreamingStdOutCallbackHandler()]
    )

    llm = LlamaCpp(
        model_path="/home/cokingtins1/Documents/Github/basic-llm/app/api/flask/capybarahermes-2.5-mistral-7b.Q4_K_M.gguf",
        temperature=0,
        max_tokens=128,
        n_gpu_layers=-1,
        n_batch=512,
        callback_manager=callback_manager,
        verbose=True,
    )

    return llm


def query_rag(query_text: str):
    embedding_function = get_HF_embeddings()

    connection = "postgresql+psycopg://langchain:langchain@localhost:6024/langchain"
    collection_name = "embeddings_llama"
    db = PGVector(
        # embeddings=get_llama_embeddings(),
        embeddings=get_HF_embeddings(),
        collection_name=collection_name,
        connection=connection,
        use_jsonb=True,
    )

    results = db.similarity_search(query_text, k=5)

    context_text = "\n\n---\n\n".join([doc[0] for doc, _score in results])
    prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
    prompt = prompt_template.format(context=context_text, question=query_text)

    callback_manager: CallbackManager = CallbackManager(
        [StreamingStdOutCallbackHandler()]
    )

    model = Llama(
        model_path=MODEL_PATH,
        temperature=0,
        max_tokens=128,
        callback_manager=callback_manager,
        verbose=False,
    )
