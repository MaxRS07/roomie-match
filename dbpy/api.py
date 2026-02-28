from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import os

app = FastAPI()

# Database path - relative to project root
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'RoomieMatch.db')

# Enable CORS - must be added BEFORE routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/query")
def query(body: dict):
    try:
        query_str = body.get("query")
        params = body.get("params", [])
        
        if not query_str:
            return {"error": "No query provided"}
        
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()

        cur.execute(query_str, params)
        
        # Check if it's a SELECT query
        if str(query_str).strip().upper().startswith("SELECT"):
            rows = cur.fetchall()
            conn.close()
            return {"data": rows}
        else:
            # For INSERT, UPDATE, DELETE
            conn.commit()
            conn.close()
            return {"data": {"affected": cur.rowcount}}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
