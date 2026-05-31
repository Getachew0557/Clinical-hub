#!/usr/bin/env python3
"""
Script to pre-build FAISS index for production deployment.
Run this script once to generate the index.faiss file, then deploy.
This avoids running the full embedding pipeline on server startup.
"""

import os
import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

def build_index():
    """Build and save FAISS index from knowledge base."""
    
    print("🔧 Building FAISS index for production...")
    
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    kb_path = os.path.join(script_dir, "app", "data", "knowledge_base.json")
    index_path = os.path.join(script_dir, "app", "data", "index.faiss")
    
    # Load knowledge base
    print(f"📖 Loading knowledge base from {kb_path}")
    with open(kb_path, "r") as f:
        knowledge_base = json.load(f)
    
    print(f"✓ Loaded {len(knowledge_base)} knowledge base entries")
    
    # Initialize embedding model
    print("🤖 Loading embedding model (all-MiniLM-L6-v2)...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    # Prepare texts for embedding
    print("📝 Preparing texts for embedding...")
    texts = [f"{item['topic']}: {item['content']}" for item in knowledge_base]
    
    # Generate embeddings
    print("⚡ Generating embeddings...")
    embeddings = model.encode(texts, show_progress_bar=True)
    embeddings = np.array(embeddings).astype('float32')
    
    print(f"✓ Generated embeddings with shape: {embeddings.shape}")
    
    # Create FAISS index
    print("🔨 Building FAISS index...")
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    
    # Save index
    print(f"💾 Saving index to {index_path}")
    faiss.write_index(index, index_path)
    
    # Verify index
    print("🔍 Verifying index...")
    loaded_index = faiss.read_index(index_path)
    print(f"✓ Index loaded successfully with {loaded_index.ntotal} vectors")
    
    print("\n✅ Index build complete!")
    print(f"📊 Statistics:")
    print(f"   - Knowledge base entries: {len(knowledge_base)}")
    print(f"   - Embedding dimension: {dimension}")
    print(f"   - Index vectors: {loaded_index.ntotal}")
    print(f"   - Index file: {index_path}")
    print(f"   - Index file size: {os.path.getsize(index_path) / 1024:.2f} KB")
    
    return index_path

if __name__ == "__main__":
    try:
        build_index()
        print("\n🎉 Ready for production deployment!")
    except Exception as e:
        print(f"\n❌ Error building index: {str(e)}")
        exit(1)
