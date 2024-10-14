from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain.schema.document import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_postgres import PGVector

from .get_embeddings import get_llama_embeddings
from .get_embeddings import get_HF_embeddings


def main():

    file_path = "C:/Users/cokin/OneDrive/Documents/GitHub/local-llm/server/assets/2024_SSOE_Benefits_Guide.pdf"

    def load_documents(path: str) -> list[Document]:
        # document_loader = PyPDFDirectoryLoader(file_path)
        document_loader = PyPDFLoader(path)
        return document_loader.load()

    def split_documents(documents: list[Document]):
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=100,
            chunk_overlap=80,
            length_function=len,
            is_separator_regex=False,
        )
        return text_splitter.split_documents(documents)

    def calc_chunk_ids(chunks: list[Document]):

        last_page_id = None
        current_chunk_index = 0

        for chunk in chunks:
            source = chunk.metadata.get("source")
            page = chunk.metadata.get("page")
            current_page_id = f"{source}:{page}"

            if current_page_id == last_page_id:
                current_chunk_index += 1
            else:
                current_chunk_index = 0
            # Calculate the chunk ID.
            chunk_id = f"{current_page_id}:{current_chunk_index}"
            last_page_id = current_page_id

            # Add it to the page meta-data.
            chunk.metadata["id"] = chunk_id

        return chunks

    def add_to_db(chunks: list[Document]):
        connection = "postgresql+psycopg://langchain:langchain@localhost:6024/langchain"
        collection_name = "embeddings_llama"

        db = PGVector(
            # embeddings=get_llama_embeddings(),
            embeddings=get_HF_embeddings(),
            collection_name=collection_name,
            connection=connection,
            use_jsonb=True,
        )

        chunks_with_ids = calc_chunk_ids(chunks)

        chunk_ids = [chunk.metadata["id"] for chunk in chunks]
        existing_items = db.get_by_ids(chunk_ids)

        existing_ids = {doc.id for doc in existing_items}

        chunk_ids = [chunk.metadata["id"] for chunk in chunks]
        existing_items = db.get_by_ids(chunk_ids)

        new_chunks = []
        for chunk in chunks_with_ids:
            if chunk.metadata["id"] not in existing_ids:
                new_chunks.append(chunk)

        if len(new_chunks):
            print(f"👉 Adding new documents: {len(new_chunks)}")
            new_chunk_ids = [chunk.metadata["id"] for chunk in new_chunks]
            db.add_documents(new_chunks, ids=new_chunk_ids)
        else:
            print("✅ No new documents to add")

    documents = load_documents(file_path)
    chunks = split_documents(documents)
    add_to_db(chunks)

    query = "When are my 401(k) contributions 100% vested?"

    # vector_store.add_documents(chunks, ids=[chunk.metadata["id"] for chunk in chunks])

    if documents:
        return "success"
    else:
        return "fail"
