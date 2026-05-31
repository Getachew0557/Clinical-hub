import os
import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from typing import List, Dict

class RAGManager:
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)
        self.kb_path = os.path.join(os.path.dirname(__file__), "..", "data", "knowledge_base.json")
        self.index_path = os.path.join(os.path.dirname(__file__), "..", "data", "index.faiss")
        self.knowledge_base = []
        self.index = None
        self.load_kb()
        self.load_or_build_index()

    def load_kb(self):
        if os.path.exists(self.kb_path):
            with open(self.kb_path, "r") as f:
                self.knowledge_base = json.load(f)
            print(f"✓ Loaded {len(self.knowledge_base)} knowledge base entries")
        else:
            print(f"Warning: Knowledge base not found at {self.kb_path}")

    def load_or_build_index(self):
        # Try to load pre-built index first (production mode)
        if os.path.exists(self.index_path):
            try:
                self.index = faiss.read_index(self.index_path)
                print(f"✓ Loaded pre-built FAISS index from {self.index_path}")
                print(f"  Index contains {self.index.ntotal} vectors")
                return
            except Exception as e:
                print(f"Warning: Failed to load pre-built index: {e}")
        
        # If no pre-built index, build it (development mode)
        if not self.knowledge_base:
            print("Warning: No knowledge base to build index from")
            return

        print("Building FAISS index from knowledge base...")
        self.build_index()

    def build_index(self):
        if not self.knowledge_base:
            return

        # Prepare texts for embedding (combining topic and content)
        texts = [f"{item['topic']}: {item['content']}" for item in self.knowledge_base]
        
        # Generate embeddings
        embeddings = self.model.encode(texts, show_progress_bar=True)
        embeddings = np.array(embeddings).astype('float32')

        # Create FAISS index
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(embeddings)
        
        # Save index for future use
        faiss.write_index(self.index, self.index_path)
        print(f"✓ Built and saved index with {len(texts)} items to {self.index_path}")

    def retrieve(self, query: str, top_k: int = 3) -> str:
        if not self.index or not self.knowledge_base:
            return "No platform information available."

        # Embed query
        query_embedding = self.model.encode([query]).astype('float32')
        
        # Search index
        distances, indices = self.index.search(query_embedding, top_k)
        
        # Extract results
        results = []
        for idx in indices[0]:
            if idx != -1 and idx < len(self.knowledge_base):
                item = self.knowledge_base[idx]
                results.append(f"{item['topic']}: {item['content']}")
        
        if not results:
            return "I couldn't find specific details, but I can help you with general navigation."
            
        return "\n\n".join(results)

# Singleton instance
rag_manager = RAGManager()
