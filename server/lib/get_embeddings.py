from langchain_community.embeddings import LlamaCppEmbeddings
from langchain_huggingface import HuggingFaceEmbeddings


def get_llama_embeddings():
    model_path = "C:/Users/cokin/OneDrive/Documents/GitHub/local-llm/server/models/capybarahermes-2.5-mistral-7b.Q4_K_M.gguf"
    llama = LlamaCppEmbeddings(
        model_path=model_path,
        n_ctx=512,
        n_parts=-1,
        seed=-1,
        f16_kv=False,
        logits_all=False,
        vocab_only=False,
        use_mlock=False,
        n_threads=None,
        n_batch=512,
        n_gpu_layers=None,
        verbose=True,
        device=None,
    )

    return llama


def get_HF_embeddings():
    model_path = "C:/Users/cokin/OneDrive/Documents/GitHub/local-llm/server/models/capybarahermes-2.5-mistral-7b.Q4_K_M.gguf"

    model_name = "sentence-transformers/all-mpnet-base-v2"
    model_kwargs = {"device": "cpu"}  # or 'cuda' for GPU
    encode_kwargs = {"normalize_embeddings": True}

    hf_embeddings = HuggingFaceEmbeddings(
        model_name=model_name, model_kwargs=model_kwargs, encode_kwargs=encode_kwargs
    )

    return hf_embeddings
