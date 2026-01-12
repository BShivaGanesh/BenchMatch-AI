import pandas as pd
import chromadb
from nomic import embed
from pathlib import Path
import logging
from sqlalchemy import create_engine
import os

# ---------------------------
# SETUP LOGGING
# ---------------------------
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ---------------------------
# CONFIG
# ---------------------------
DATA_DIR = Path("data")  
CHROMA_DIR = "chroma_data"
COLLECTION_NAME = "employees"
EMBED_MODEL = "nomic-embed-text-v1.5"

# ---------------------------
# LOAD CSVs
# ---------------------------
# ---------------------------
# AZURE SQL CONFIG (ENTRA ID AUTH)
# ---------------------------
# Using Entra ID (Azure AD) authentication with pyodbc + ODBC Driver 18
import urllib.parse

AZURE_SQL_SERVER = "ai-db-dbs.database.windows.net"
AZURE_SQL_DATABASE = "db_bench"

# For Entra ID Interactive Authentication (opens browser for login)
AZURE_SQL_CONN_STR = (
    f"mssql+pyodbc://@{AZURE_SQL_SERVER}/{AZURE_SQL_DATABASE}"
    "?driver=ODBC+Driver+18+for+SQL+Server"
    "&authentication=ActiveDirectoryInteractive"
)

logger.info(f"Connecting to Azure SQL: {AZURE_SQL_SERVER}/{AZURE_SQL_DATABASE} (Entra ID)")

# Create engine (lazy connection - only connects when needed)
engine = None

def get_engine():
    """Get or create the SQLAlchemy engine."""
    global engine
    if engine is None:
        engine = create_engine(AZURE_SQL_CONN_STR)
    return engine

# Connection will be tested on first actual data load (lazy initialization)
    # Don't raise - let it fail gracefully on actual usage

# def load_csvs():
#     try:
#         employees = pd.read_csv(DATA_DIR / "employees.csv")
#         skills = pd.read_csv(DATA_DIR / "skills.csv")
#         certs = pd.read_csv(DATA_DIR / "certifications.csv")
#         projects = pd.read_csv(DATA_DIR / "project_history.csv")
        
#         logger.info(f"Loaded {len(employees)} employees")
#         logger.info(f"Loaded {len(skills)} skill records")
#         logger.info(f"Loaded {len(certs)} certification records")
#         logger.info(f"Loaded {len(projects)} project records")
        
#         return employees, skills, certs, projects
#     except FileNotFoundError as e:
#         logger.error(f"CSV file not found: {e}")
#         raise
#     except Exception as e:
#         logger.error(f"Error loading CSVs: {e}")
#         raise
def load_from_azure_sql():
    """
    Load all employee-related tables from Azure SQL.
    Acts as a drop-in replacement for CSV loading.
    """
    try:
        db_engine = get_engine()
        employees = pd.read_sql("SELECT * FROM employees", db_engine)
        skills = pd.read_sql("SELECT * FROM skills", db_engine)
        certs = pd.read_sql("SELECT * FROM certifications", db_engine)
        projects = pd.read_sql("SELECT * FROM project_history", db_engine)

        logger.info(f"✓ Loaded {len(employees)} employees from Azure SQL")
        logger.info(f"✓ Loaded {len(skills)} skill records from Azure SQL")
        logger.info(f"✓ Loaded {len(certs)} certification records from Azure SQL")
        logger.info(f"✓ Loaded {len(projects)} project records from Azure SQL")

        return employees, skills, certs, projects

    except Exception as e:
        logger.error(f"Error loading data from Azure SQL: {e}")
        raise


# def load_bench_status():
#     """Load bench status data and return as indexed dataframe."""
#     try:
#         bench_df = pd.read_csv(DATA_DIR / "bench_status.csv")
#         return bench_df.set_index("employee_id")
#     except Exception as e:
#         logger.error(f"Error loading bench_status.csv: {e}")
#         raise
def load_bench_status():
    """
    Load bench status from Azure SQL and index by employee_id.
    """
    try:
        db_engine = get_engine()
        bench_df = pd.read_sql(
            "SELECT employee_id, status FROM bench_status",
            db_engine
        )
        return bench_df.set_index("employee_id")

    except Exception as e:
        logger.error(f"Error loading bench status from Azure SQL: {e}")
        raise


# ---------------------------
# AGGREGATE EMPLOYEE DATA
# ---------------------------
def aggregate_employee_data(employees, skills, certs, projects):
    skills_grp = skills.groupby("employee_id").apply(
        lambda x: ", ".join(
            f"{r.skill_name} ({r.years_experience} yrs)" for _, r in x.iterrows()
        )
    ).reset_index(name="skills")

    certs_grp = certs.groupby("employee_id")["certificate_name"] \
        .apply(lambda x: ", ".join(x)).reset_index(name="certifications")

    projects_grp = projects.groupby("employee_id")["experience_summary"] \
        .apply(lambda x: " ".join(x)).reset_index(name="experience")

    df = employees \
        .merge(skills_grp, on="employee_id", how="left") \
        .merge(certs_grp, on="employee_id", how="left") \
        .merge(projects_grp, on="employee_id", how="left")

    df.fillna("", inplace=True)
    return df


# ---------------------------
# BUILD EMBEDDABLE TEXT
# ---------------------------
def build_employee_text(row):
    """Build entity-based chunk for one employee."""
    chunk = f"""Role: {row['role']}
Primary Skill: {row['primary_skill']}
Skills: {row.get('skills', '')}
Certifications: {row.get('certifications', '')}
Experience: {row.get('experience', '')}"""
    
    return chunk.strip()


# ---------------------------
# GET EMBEDDING (NOMIC)
# ---------------------------
def get_embedding(text):
    """Generate embedding for a single text chunk using Nomic Embed."""
    try:
        result = embed.text(
            texts=[text],
            model=EMBED_MODEL
        )
        return result["embeddings"][0]
    except Exception as e:
        logger.error(f"Error generating embedding: {e}")
        raise


# ---------------------------
# INGEST INTO CHROMADB
# ---------------------------
def ingest():
    """
    Azure SQL → Aggregation → Embedding → ChromaDB Pipeline
    Entity-based chunking: One employee = One chunk = One embedding
    """
    try:
        logger.info("🔹 Loading data from Azure SQL Database...")
        employees, skills, certs, projects = load_from_azure_sql()

        logger.info("🔹 Aggregating employee data...")
        df = aggregate_employee_data(employees, skills, certs, projects)

        logger.info("🔹 Initializing ChromaDB...")
        # Use persistent client for disk-based storage
        client = chromadb.PersistentClient(path=CHROMA_DIR)
        collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )

        logger.info(f"🔹 Generating embeddings for {len(df)} employees...")
        successful = 0
        failed = 0

        for idx, (_, row) in enumerate(df.iterrows(), 1):
            try:
                employee_id = str(row["employee_id"])
                employee_text = build_employee_text(row)
                embedding = get_embedding(employee_text)

                # Upsert to ChromaDB with metadata
                collection.upsert(
                    ids=[employee_id],
                    documents=[employee_text],
                    embeddings=[embedding],
                    metadatas=[{
                        "employee_id": employee_id,
                        "role": str(row.get("role", "Unknown"))
                    }]
                )
                successful += 1
                
                if idx % 10 == 0:
                    logger.info(f"  Processed {idx}/{len(df)} employees...")
                    
            except Exception as e:
                logger.warning(f"Failed to process employee {row.get('employee_id', 'unknown')}: {e}")
                failed += 1

        logger.info(f"Ingestion complete: {successful} succeeded, {failed} failed")
        logger.info(f"ChromaDB collection '{COLLECTION_NAME}' has {collection.count()} embeddings")
        logger.info(f"Data persisted to {CHROMA_DIR}/")
        
        return collection
        
    except Exception as e:
        logger.error(f"Ingestion pipeline failed: {e}")
        raise


# ---------------------------
# SEARCH FUNCTION
# ---------------------------
# def search_employees(query_text: str, top_n: int = 5, allow_partial: bool = True):
#     """
#     Semantic search for employees based on free-text project requirement.
#     Filters by bench status (Bench or Partial if allow_partial=True).
    
#     Args:
#         query_text: Free-text project requirement
#         top_n: Number of top matches to return
#         allow_partial: Include "Partial" bench status employees (default: True)
        
#     Returns:
#         List of dicts with employee_id, role, bench_status, and similarity_score
#     """
#     try:
#         logger.info(f"🔍 Searching for: '{query_text}'")
        
#         # Load bench status data
#         bench_df = load_bench_status()
        
#         # Load persisted ChromaDB
#         client = chromadb.PersistentClient(path=CHROMA_DIR)
#         collection = client.get_collection(COLLECTION_NAME)
        
#         # Generate embedding for query
#         query_embedding = get_embedding(query_text)
        
#         # Perform similarity search with wider window to account for filtering
#         results = collection.query(
#             query_embeddings=[query_embedding],
#             n_results=top_n * 3,  # widen retrieval to account for bench filtering
#             include=["metadatas", "distances"]
#         )
        
#         # Format results with bench filtering
#         matches = []
#         if results["ids"] and len(results["ids"]) > 0:
#             for emp_id, metadata, distance in zip(
#                 results["ids"][0], 
#                 results["metadatas"][0], 
#                 results["distances"][0]
#             ):
#                 # Filter by bench status
#                 if emp_id not in bench_df.index:
#                     continue
                
#                 status = bench_df.loc[emp_id]["status"]
                
#                 # Include only "Bench" or "Partial" (if allowed)
#                 if status == "Bench" or (allow_partial and status == "Partial"):
#                     matches.append({
#                         "employee_id": emp_id,
#                         "role": metadata.get("role", "Unknown"),
#                         "bench_status": status,
#                         "similarity_score": round(1 - distance, 4)
#                     })
                
#                 # Stop when we have enough matches
#                 if len(matches) == top_n:
#                     break
        
#         logger.info(f"Found {len(matches)} bench-eligible candidates")
#         return matches
        
#     except Exception as e:
#         logger.error(f"Search failed: {e}")
#         raise

def search_employees(
    query_text: str,
    top_n: int = 5,
    allow_partial: bool = True,   # kept for future use
    debug: bool = True
):
    """
    Hybrid search: embeddings + business logic + field-level matching + re-ranking.
    
    Strategy:
    1. Normalize short queries (add context)
    2. Retrieve top-K with embeddings (wide net)
    3. Apply bench status filter (business rule)
    4. Boost exact role matches (categorical logic)
    5. Boost primary skill matches (field importance)
    6. Re-rank by combined score
    """

    logger.info(f"🔍 Original query: '{query_text}'")
    logger.info(f"Allow Partial Bench: {allow_partial}")

    # ---------------------------
    # 1. NORMALIZE QUERY (ADD CONTEXT TO SHORT QUERIES)
    # ---------------------------
    def normalize_query(q: str) -> str:
        tokens = q.strip().split()
        if len(tokens) == 1:
            return f"{q} developer engineer professional"
        if len(tokens) == 2:
            return f"{q} professional development experience"
        return q

    normalized_query = normalize_query(query_text)
    logger.info(f"🔎 Normalized query: '{normalized_query}'")

    # ---------------------------
    # 2. LOAD DATA
    # ---------------------------
    bench_df = load_bench_status()
    employees_df, skills_df, certs_df, projects_df = load_from_azure_sql()
    
    # Merge to have all employee data in one place
    full_emp_df = employees_df.copy()

    if debug:
        logger.info(
            f"📊 Bench distribution: {bench_df['status'].value_counts().to_dict()}"
        )

    # ---------------------------
    # 3. RETRIEVE CANDIDATES WITH EMBEDDINGS
    # ---------------------------
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    collection = client.get_collection(COLLECTION_NAME)

    query_embedding = get_embedding(normalized_query)

    # Wide retrieval window to get enough candidates after filtering
    retrieval_k = max(top_n * 6, 35)
    logger.info(f"🔄 Retrieving top {retrieval_k} candidates with embeddings")

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=retrieval_k,
        include=["metadatas", "distances"]
    )

    # ---------------------------
    # 4. APPLY BENCH STATUS FILTER + BUILD MATCH LIST
    # ---------------------------
    candidates = []
    dropped_not_eligible = 0
    dropped_missing = 0

    for emp_id, metadata, distance in zip(
        results["ids"][0],
        results["metadatas"][0],
        results["distances"][0]
    ):
        # Check if employee has bench status
        if emp_id not in bench_df.index:
            dropped_missing += 1
            continue

        # Extract bench status (handle Series case)
        status_series = bench_df.loc[emp_id]["status"]
        if isinstance(status_series, pd.Series):
            status = status_series.iloc[0]
        else:
            status = status_series

        # BENCH RULE: Only include "inactive" (adjust as needed)
        if status != "inactive":
            dropped_not_eligible += 1
            continue

        # Get employee data
        emp_data = full_emp_df[full_emp_df["employee_id"] == emp_id]
        if emp_data.empty:
            dropped_missing += 1
            continue

        emp_row = emp_data.iloc[0]
        
        # Get employee's skills for matching
        emp_skills = skills_df[skills_df["employee_id"] == emp_id]["skill_name"].tolist()
        emp_primary = str(emp_row.get("primary_skill", "")).lower()
        emp_role = str(emp_row.get("role", "")).lower()

        # Embedding-based score (convert distance to similarity)
        embedding_score = 1 - distance

        # ---------------------------
        # 5. BOOST SIGNALS (BUSINESS LOGIC)
        # ---------------------------
        boost_factor = 1.0

        # SIGNAL 1: Exact role match (HIGHEST priority)
        query_lower = query_text.lower()
        if emp_role == query_lower:
            boost_factor *= 2.0  # 100% boost (multiply by 2x)
            logger.info(f"  🎯 {emp_id}: EXACT role match ({emp_role}) (×2.0)")
        
        # SIGNAL 2: Role word appears in employee role
        elif any(word in emp_role for word in query_lower.split() if len(word) > 2):
            boost_factor *= 1.5  # 50% boost
            logger.info(f"  ✓ {emp_id}: Role keyword in '{emp_role}' (×1.5)")

        # SIGNAL 3: PRIMARY SKILL IS IN THE QUERY (VERY IMPORTANT)
        if emp_primary and emp_primary in query_lower:
            boost_factor *= 1.8  # 80% boost
            logger.info(f"  ⭐ {emp_id}: PRIMARY skill '{emp_primary}' matches (×1.8)")

        # SIGNAL 4: ANY SKILL IN EMPLOYEE MATCHES QUERY TERMS
        query_terms = set(query_lower.split())
        emp_skills_lower = [s.lower() for s in emp_skills]
        
        matching_skills = [s for s in emp_skills_lower if any(term in s for term in query_terms)]
        if matching_skills:
            num_matches = len(matching_skills)
            skill_boost = min(1.0 + (num_matches * 0.3), 2.0)  # Cap at 2x
            boost_factor *= skill_boost
            logger.info(f"  🔧 {emp_id}: Found {num_matches} matching skills (×{skill_boost:.1f})")

        # Compute final score: embedding provides relevance, boosts apply field importance
        final_score = embedding_score * boost_factor

        candidates.append({
            "employee_id": emp_id,
            "role": metadata.get("role", "Unknown"),
            "primary_skill": emp_primary,
            "bench_status": status,
            "embedding_score": round(embedding_score, 4),
            "boost_factor": round(boost_factor, 2),
            "final_score": round(final_score, 4)
        })

    # ---------------------------
    # 6. RE-RANK BY FINAL SCORE
    # ---------------------------
    candidates.sort(key=lambda x: x["final_score"], reverse=True)
    matches = candidates[:top_n]

    # ---------------------------
    # 7. FORMAT OUTPUT
    # ---------------------------
    output = []
    for match in matches:
        output.append({
            "employee_id": match["employee_id"],
            "role": match["role"],
            "primary_skill": match["primary_skill"],
            "bench_status": match["bench_status"],
            "similarity_score": match["final_score"]  # User sees final score
        })

    # ---------------------------
    # 8. LOGGING
    # ---------------------------
    logger.info(f"✓ Found {len(output)} bench-eligible candidates (after re-ranking)")

    if debug:
        logger.info(
            f"🧹 Dropped {dropped_not_eligible} (not inactive), "
            f"{dropped_missing} (missing bench record)"
        )

    return output

if __name__ == "__main__":
    ingest()