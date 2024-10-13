from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.document_loaders import PyPDFDirectoryLoader

def main():

    file_path = "C:/Users/cokin/OneDrive/Documents/GitHub/local-llm/server/assets/2024_SSOE_Benefits_Guide.pdf"

    def load_documents():
        # document_loader = PyPDFDirectoryLoader(file_path)
        document_loader = PyPDFLoader(file_path)
        return document_loader.load()
 
    documents = load_documents()

    if documents:
        return documents[0]
    else:
        return None
