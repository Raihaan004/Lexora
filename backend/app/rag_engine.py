import os
# Force offline mode for Hugging Face
os.environ["TRANSFORMERS_OFFLINE"] = "1"
os.environ["HF_HUB_OFFLINE"] = "1"

from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
import torch

# Configuration
DOCUMENTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../documents"))
VECTOR_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../faiss_index"))

# Ensure documents directory exists
if not os.path.exists(DOCUMENTS_DIR):
    os.makedirs(DOCUMENTS_DIR)

class RAGEngine:
    def __init__(self):
        # Use CPU for embeddings to avoid CUDA issues if not present
        device = "cuda" if torch.cuda.is_available() else "cpu"
        try:
            print("Initializing embeddings model (OFFLINE MODE)...")
            self.embeddings = HuggingFaceEmbeddings(
                model_name="all-MiniLM-L6-v2",
                model_kwargs={
                    'device': device,
                    'local_files_only': True
                }
            )
            print("Embeddings model loaded successfully from local cache.")
        except Exception as e:
            print(f"Error: Could not load embeddings model locally. {e}")
            print("Please ensure the model 'all-MiniLM-L6-v2' is downloaded.")
            # Fallback to Ollama embeddings if HuggingFace fails
            print("Attempting to use Ollama for embeddings as fallback...")
            try:
                from langchain_ollama import OllamaEmbeddings
                self.embeddings = OllamaEmbeddings(model="mistral")
                print("Using Ollama (mistral) for embeddings.")
            except Exception as e2:
                print(f"Critical Error: All embedding methods failed. {e2}")
                raise e

        self.llm = OllamaLLM(model="mistral")
        self.vector_store = None
        self.load_vector_store()

    def load_vector_store(self):
        if os.path.exists(VECTOR_DB_PATH):
            try:
                self.vector_store = FAISS.load_local(
                    VECTOR_DB_PATH, 
                    self.embeddings, 
                    allow_dangerous_deserialization=True
                )
            except Exception as e:
                print(f"Error loading vector store: {e}")
                self.reindex_all()
        else:
            # Initialize an empty vector store if no index exists
            self.reindex_all()

    def index_file(self, file_path: str):
        """Indexes a single file and adds it to the existing vector store."""
        documents = []
        filename = os.path.basename(file_path)
        try:
            if filename.endswith(".pdf"):
                loader = PyPDFLoader(file_path)
            elif filename.endswith(".docx"):
                loader = Docx2txtLoader(file_path)
            elif filename.endswith(".txt"):
                loader = TextLoader(file_path)
            else:
                return
            documents.extend(loader.load())
        except Exception as e:
            print(f"Error loading {filename}: {e}")
            return

        if not documents:
            return

        # Optimized: Smaller chunk size for faster processing and more precise retrieval
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        texts = text_splitter.split_documents(documents)
        
        print(f"Adding {len(texts)} text chunks from {filename} to index...")
        
        if self.vector_store is None:
            self.vector_store = FAISS.from_documents(texts, self.embeddings)
        else:
            self.vector_store.add_documents(texts)
        
        self.vector_store.save_local(VECTOR_DB_PATH)
        print(f"Successfully indexed {filename}")

    def reindex_all(self):
        print("Re-indexing all documents...")
        documents = []
        if not os.path.exists(DOCUMENTS_DIR):
            os.makedirs(DOCUMENTS_DIR)
            
        files = [f for f in os.listdir(DOCUMENTS_DIR) if f.endswith((".pdf", ".docx", ".txt"))]
        if not files:
            print("No documents found to index.")
            self.vector_store = None
            return

        for filename in files:
            file_path = os.path.join(DOCUMENTS_DIR, filename)
            try:
                if filename.endswith(".pdf"):
                    loader = PyPDFLoader(file_path)
                elif filename.endswith(".docx"):
                    loader = Docx2txtLoader(file_path)
                elif filename.endswith(".txt"):
                    loader = TextLoader(file_path)
                documents.extend(loader.load())
            except Exception as e:
                print(f"Error loading {filename}: {e}")

        # Optimized: Smaller chunk size for faster processing and more precise retrieval
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        texts = text_splitter.split_documents(documents)
        
        print(f"Creating new index with {len(texts)} chunks...")
        self.vector_store = FAISS.from_documents(texts, self.embeddings)
        self.vector_store.save_local(VECTOR_DB_PATH)
        print("Re-indexing complete.")

    def query(self, question: str):
        if not self.vector_store:
            return "No documents uploaded yet. Please upload some documents first."
        
        retriever = self.vector_store.as_retriever(search_kwargs={"k": 3})
        
        # Optimized: More concise prompt to reduce generation time
        template = """Answer the question concisely based ONLY on the provided context. 
If the answer is not in the context, say you don't know.

Context:
{context}

Question: {question}

Answer:"""
        prompt = ChatPromptTemplate.from_template(template)
        
        def format_docs(docs):
            return "\n\n".join([d.page_content for d in docs])

        chain = (
            {"context": retriever | format_docs, "question": RunnablePassthrough()}
            | prompt
            | self.llm
            | StrOutputParser()
        )
        
        return chain.invoke(question)

    def stream_query(self, question: str):
        """Streams the response for real-time feedback."""
        if not self.vector_store:
            yield "No documents uploaded yet."
            return
        
        retriever = self.vector_store.as_retriever(search_kwargs={"k": 3})
        template = """Answer the question concisely based ONLY on the provided context. 
If the answer is not in the context, say you don't know.

Context:
{context}

Question: {question}

Answer:"""
        prompt = ChatPromptTemplate.from_template(template)
        
        def format_docs(docs):
            return "\n\n".join([d.page_content for d in docs])

        chain = (
            {"context": retriever | format_docs, "question": RunnablePassthrough()}
            | prompt
            | self.llm
            | StrOutputParser()
        )
        
        for chunk in chain.stream(question):
            yield chunk

rag_engine = RAGEngine()
