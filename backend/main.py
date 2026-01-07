from fastapi import FastAPI
from data_ingestion import ingest, search_employees
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

@app.get("/hello-world")
def hello_world():
    return {"status": "ok"}


@app.post("/search")
def search(query: str, top_n: int = 5, allow_partial: bool = True):
    """
    Semantic search endpoint for finding matching bench-eligible employees.
    
    Args:
        query: Free-text project requirement
        top_n: Number of top matches to return
        allow_partial: Include "Partial" bench status employees (default: True)
        
    Returns:
        List of matching employees with bench status and similarity scores
    """
    try:
        results = search_employees(query, top_n, allow_partial)
        return {
            "query": query,
            "matches": results,
            "count": len(results),
            "allow_partial": allow_partial
        }
    except Exception as e:
        logger.error(f"Search error: {e}")
        return {"error": str(e), "status": "failed"}


# ========================================
# TEST FUNCTIONS (Run with: python -m main)
# ========================================
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "ingest":
        logger.info("Starting data ingestion...")
        ingest()
        logger.info("Ingestion complete!")
    
    elif len(sys.argv) > 1 and sys.argv[1] == "search":
        query = sys.argv[2] if len(sys.argv) > 2 else "React frontend development"
        allow_partial = "no-partial" not in sys.argv
        
        logger.info(f"Testing search with query: '{query}'")
        logger.info(f"Allow Partial Bench: {allow_partial}")
        
        results = search_employees(query, top_n=5, allow_partial=allow_partial)
        
        if results:
            print("\n" + "="*70)
            print("BENCH-ELIGIBLE EMPLOYEE MATCHES")
            print("="*70)
            for i, match in enumerate(results, 1):
                print(f"\n{i}. Employee: {match['employee_id']} | Role: {match['role']}")
                print(f"   Bench Status: {match['bench_status']}")
                print(f"   Similarity Score: {match['similarity_score']:.4f}")
            print("\n" + "="*70 + "\n")
        else:
            print("No bench-eligible candidates found.")
    
    else:
        print("Usage:")
        print("  python main.py ingest                                    # Run data ingestion pipeline")
        print("  python main.py search <query>                           # Test search with custom query")
        print("  python main.py search <query> no-partial                # Search (exclude Partial bench)")
        print("  python main.py search                                   # Test search with default query")
        print("\nAPI Endpoint:")
        print("  POST /search?query=<text>&top_n=5&allow_partial=true    # Semantic search endpoint")
