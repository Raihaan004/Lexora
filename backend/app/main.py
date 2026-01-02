import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.rag_engine import rag_engine, DOCUMENTS_DIR

app = FastAPI(title="Lexora API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuestionRequest(BaseModel):
    question: str

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith((".pdf", ".docx", ".txt")):
        raise HTTPException(status_code=400, detail="Unsupported file type")
    
    file_path = os.path.join(DOCUMENTS_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Incremental indexing: only index the new file
    rag_engine.index_file(file_path)
    
    return {"message": f"Successfully uploaded and indexed {file.filename}"}

@app.post("/ask")
async def ask_question(request: QuestionRequest):
    try:
        if not request.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        # Ensure index is loaded if documents exist but index is empty
        if rag_engine.vector_store is None and os.listdir(DOCUMENTS_DIR):
            print("Index empty but documents found. Re-indexing...")
            rag_engine.reindex_all()

        answer = rag_engine.query(request.question)
        return {"answer": answer}
    except Exception as e:
        print(f"Error in /ask: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask_stream")
async def ask_question_stream(request: QuestionRequest):
    try:
        if not request.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        if rag_engine.vector_store is None and os.listdir(DOCUMENTS_DIR):
            rag_engine.reindex_all()

        return StreamingResponse(
            rag_engine.stream_query(request.question),
            media_type="text/event-stream"
        )
    except Exception as e:
        print(f"Error in /ask_stream: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents")
async def list_documents():
    files = os.listdir(DOCUMENTS_DIR)
    return [f for f in files if f.endswith((".pdf", ".docx", ".txt"))]

@app.delete("/documents/{filename}")
async def delete_document(filename: str):
    file_path = os.path.join(DOCUMENTS_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        rag_engine.reindex_all()
        return {"message": f"Deleted {filename}"}
    else:
        raise HTTPException(status_code=404, detail="File not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
