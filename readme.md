# Lexora 🧠📄  
### A Self-Hosted AI Chatbot for Your Documents (No ChatGPT, No Cloud)

Lexora is a **private AI document chatbot** that allows users to upload documents and ask questions in natural language.  
The system answers **only from the uploaded documents** using a **locally running open-source AI model**.

Lexora does **NOT** use ChatGPT, OpenAI, or any paid cloud AI service.  
Everything runs on your **own machine**, making it secure and private.

---

## 🔍 Why Lexora?

Most AI chatbots:
- Send your data to the cloud  
- Use paid APIs  
- Do not respect privacy  

**Lexora solves this by:**
- Running AI models locally
- Keeping documents private
- Giving accurate answers only from your files

---

## 🧠 What Lexora Does (In Simple Words)

1. You upload documents (PDFs)
2. Lexora reads and understands them
3. Lexora stores the meaning of the text
4. You ask a question
5. Lexora finds the correct information
6. Lexora generates an answer using its own AI model

Think of Lexora as:
> “ChatGPT, but trained only on *your* documents and running on *your* computer.”

---

## 🏗️ How Lexora Works (High-Level Flow)

Documents → Split into small parts → Convert to meaning numbers → Store in memory  
User Question → Convert to meaning → Find matching parts → AI generates answer  

This method is called **Retrieval-Augmented Generation (RAG)**.

---

## 🧩 Main Components Explained Simply

| Component | What it does |
|---------|--------------|
| Document Loader | Reads PDF files |
| Text Splitter | Breaks text into small pieces |
| Embeddings | Converts text into numbers that represent meaning |
| Vector Database | Stores and searches meaning |
| Local AI Model | Generates human-like answers |
| API Server | Connects frontend and AI |

---

## 🛠️ Tech Stack Used

### Backend (AI Logic)
- Python 3.10+
- FastAPI
- LangChain
- FAISS (Vector Database)
- Sentence-Transformers (Embeddings)
- Ollama (Local AI runtime)
- Mistral 7B (Open-source AI model)

### Frontend (User Interface)
- React / Next.js
- HTML, CSS, JavaScript
- Fetch / Axios for API calls

### AI Architecture
- Retrieval-Augmented Generation (RAG)
- Fully local execution
- No external AI APIs

---

## 💻 System Requirements

### Minimum Hardware
- RAM: 8 GB
- CPU: i5 / Ryzen 5 or above
- Storage: 10–20 GB free
- GPU: Optional (CPU works)

### Software
- Python 3.10+
- Node.js 18+
- Git
- Ollama

---

## 📂 Project Folder Structure

