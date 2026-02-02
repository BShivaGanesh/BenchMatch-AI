import pandas as pd
import chromadb
import nomic
from nomic import embed
from pathlib import Path
import logging
from sqlalchemy import create_engine
import os
from llama_index.llms.ollama import Ollama
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

NOMIC_API_KEY = os.getenv("NOMIC_API_KEY")
if NOMIC_API_KEY:
    # Login to Nomic with API key
    nomic.login(NOMIC_API_KEY)
else:
    logger = logging.getLogger(__name__)
    logger.warning("⚠️  NOMIC_API_KEY not set. Embedding features will be disabled.")
# ---------------------------
# SETUP LOGGING
# ---------------------------
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
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

# For Entra ID Integrated Authentication (uses Windows/Azure credentials)
# No browser popup, uses current user's credentials
AZURE_SQL_CONN_STR = (
    f"mssql+pyodbc://@{AZURE_SQL_SERVER}/{AZURE_SQL_DATABASE}"
    "?driver=ODBC+Driver+18+for+SQL+Server"
    "&authentication=ActiveDirectoryIntegrated"
)

logger.info(
    f"Connecting to Azure SQL: {AZURE_SQL_SERVER}/{AZURE_SQL_DATABASE} (Entra ID)"
)

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


def load_csvs():
    try:
        employees = pd.read_csv(DATA_DIR / "employees.csv")
        skills = pd.read_csv(DATA_DIR / "skills.csv")
        certs = pd.read_csv(DATA_DIR / "certifications.csv")
        projects = pd.read_csv(DATA_DIR / "project_history.csv")

        logger.info(f"Loaded {len(employees)} employees")
        logger.info(f"Loaded {len(skills)} skill records")
        logger.info(f"Loaded {len(certs)} certification records")
        logger.info(f"Loaded {len(projects)} project records")

        return employees, skills, certs, projects
    except FileNotFoundError as e:
        logger.error(f"CSV file not found: {e}")
        raise
    except Exception as e:
        logger.error(f"Error loading CSVs: {e}")
        raise
    # def load_from_azure_sql():
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


def load_bench_status():
    """Load bench status data and return as indexed dataframe."""
    try:
        bench_df = pd.read_csv(DATA_DIR / "bench_status.csv")
        return bench_df.set_index("employee_id")
    except Exception as e:
        logger.error(f"Error loading bench_status.csv: {e}")
        raise


# def load_bench_status():
#     """
#     Load bench status from Azure SQL and index by employee_id.
#     """
#     try:
#         db_engine = get_engine()
#         bench_df = pd.read_sql(
#             "SELECT employee_id, status FROM bench_status",
#             db_engine
#         )
#         return bench_df.set_index("employee_id")

#     except Exception as e:
#         logger.error(f"Error loading bench status from Azure SQL: {e}")
#         raise


# ---------------------------
# AGGREGATE EMPLOYEE DATA
# ---------------------------
def aggregate_employee_data(employees, skills, certs, projects):
    skills_grp = (
        skills.groupby("employee_id")
        .apply(
            lambda x: ", ".join(
                f"{r.skill_name} ({r.years_experience} yrs)" for _, r in x.iterrows()
            )
        )
        .reset_index(name="skills")
    )

    certs_grp = (
        certs.groupby("employee_id")["certificate_name"]
        .apply(lambda x: ", ".join(x))
        .reset_index(name="certifications")
    )

    projects_grp = (
        projects.groupby("employee_id")["experience_summary"]
        .apply(lambda x: " ".join(x))
        .reset_index(name="experience")
    )

    df = (
        employees.merge(skills_grp, on="employee_id", how="left")
        .merge(certs_grp, on="employee_id", how="left")
        .merge(projects_grp, on="employee_id", how="left")
    )

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
            model=EMBED_MODEL,
            task_type="search_query"  # Nomic requires task_type for v1.5
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
        employees, skills, certs, projects = load_csvs()

        logger.info("🔹 Aggregating employee data...")
        df = aggregate_employee_data(employees, skills, certs, projects)

        logger.info("🔹 Initializing ChromaDB...")
        # Use persistent client for disk-based storage
        client = chromadb.PersistentClient(path=CHROMA_DIR)
        collection = client.get_or_create_collection(
            name=COLLECTION_NAME, metadata={"hnsw:space": "cosine"}
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
                    metadatas=[
                        {
                            "employee_id": employee_id,
                            "role": str(row.get("role", "Unknown")),
                        }
                    ],
                )
                successful += 1

                if idx % 10 == 0:
                    logger.info(f"  Processed {idx}/{len(df)} employees...")

            except Exception as e:
                logger.warning(
                    f"Failed to process employee {row.get('employee_id', 'unknown')}: {e}"
                )
                failed += 1

        logger.info(f"Ingestion complete: {successful} succeeded, {failed} failed")
        logger.info(
            f"ChromaDB collection '{COLLECTION_NAME}' has {collection.count()} embeddings"
        )
        logger.info(f"Data persisted to {CHROMA_DIR}/")

        return collection

    except Exception as e:
        logger.error(f"Ingestion pipeline failed: {e}")
        raise

    """Parse query to extract skills, experience, certifications."""
    import re

    # Extract years of experience
    exp_match = re.search(r"(\d+)\s*(?:years?|yrs?)", query_text.lower())
    required_exp = int(exp_match.group(1)) if exp_match else 0

    # Extract skills (common tech keywords)
    tech_keywords = [
        "react",
        "node",
        "typescript",
        "javascript",
        "python",
        "java",
        "aws",
        "azure",
        "kubernetes",
        "docker",
        "sql",
        "postgresql",
        "frontend",
        "backend",
        "fullstack",
        "full stack",
        "devops",
    ]

    required_skills = [skill for skill in tech_keywords if skill in query_text.lower()]

    # Extract certifications (if any mentioned)
    cert_keywords = [
        "aws solutions architect",
        "azure dp",
        "certified",
        "pmp",
        "scrum master",
    ]
    required_certs = [cert for cert in cert_keywords if cert in query_text.lower()]

    return {
        "skills": required_skills,
        "experience_years": required_exp,
        "certifications": required_certs,
    }


def calculate_skill_matches(required_skills, emp_skills_df, emp_id):
    """Compare required skills with candidate's actual skills."""
    emp_skills = emp_skills_df[emp_skills_df["employee_id"] == emp_id]

    skill_details = []
    matched_count = 0

    for req_skill in required_skills:
        # Find matching skills in employee's skillset
        matches = emp_skills[
            emp_skills["skill_name"].str.lower().str.contains(req_skill, na=False)
        ]

        if not matches.empty:
            best_match = matches.iloc[0]
            skill_details.append(
                {
                    "required_skill": req_skill.capitalize(),
                    "candidate_evidence": f"{best_match['skill_name']} ({best_match.get('years_experience', 0)} yrs)",
                    "confidence": 95,  # High confidence for exact match
                }
            )
            matched_count += 1
        else:
            skill_details.append(
                {
                    "required_skill": req_skill.capitalize(),
                    "candidate_evidence": "Not found",
                    "confidence": 0,
                }
            )

    match_percentage = (
        (matched_count / len(required_skills) * 100) if required_skills else 0
    )

    return skill_details, int(match_percentage)


def calculate_cert_matches(required_certs, emp_certs_df, emp_id):
    """Strict certification matching + additional certs."""
    emp_certs = emp_certs_df[emp_certs_df["employee_id"] == emp_id]
    emp_cert_list = (
        [c.lower() for c in emp_certs["certificate_name"].str.lower().tolist()]
        if not emp_certs.empty
        else []
    )

    cert_details = {"required": [], "additional": []}

    matched_required = 0

    # STRICT matching for REQUIRED certifications
    for req_cert in required_certs:
        req_lower = req_cert.lower()
        is_met = False

        for emp_cert in emp_cert_list:
            # Exact or partial match (case insensitive)
            if req_lower in emp_cert or emp_cert in req_lower:
                is_met = True
                break

        cert_details["required"].append(
            {
                "certificate_name": req_cert.title(),
                "status": "✓ Met" if is_met else "✗ Missing",
                "issued_by": "",
            }
        )

        if is_met:
            matched_required += 1

    # Additional certifications (not matching required)
    for idx, emp_cert_row in emp_certs.iterrows():
        emp_cert_name = emp_cert_row["certificate_name"].lower()
        is_required = any(req.lower() in emp_cert_name for req in required_certs)

        if not is_required:
            cert_details["additional"].append(
                {
                    "certificate_name": emp_cert_row["certificate_name"],
                    "status": "Held",
                    "issued_by": emp_cert_row.get("issued_by", "N/A"),
                }
            )

    # CERTIFICATION SCORE
    if required_certs:
        cert_match_pct = int((matched_required / len(required_certs)) * 100)
    else:
        # No required certs = bonus for having any certs
        cert_match_pct = min(len(emp_cert_list) * 15, 60)  # Cap at 60% max bonus

    return cert_details, cert_match_pct


def search_employees(
    # Structured form inputs (from frontend)
    required_skills: list = None,
    required_certs: list = None,
    min_experience: int = 0,
    role_title: str = "",
    requirement_summary: str = "",
    # Search parameters
    top_n: int = 5,
    allow_partial: bool = True,
    debug: bool = True,
):
    """
    Structured search with form inputs (no parsing needed).

    Args:
        required_skills: List of skill names from frontend tags (e.g., ["React", "Node.js", "AWS"])
        required_certs: List of certification names (e.g., ["AWS Solutions Architect", "Azure DP-203"])
        min_experience: Minimum years of experience required (int)
        role_title: Job role title (e.g., "Senior Full Stack Engineer")
        requirement_summary: Free-text project description (for embeddings)
        top_n: Number of results to return
        allow_partial: Include partial bench status
        debug: Enable debug logging

    Returns:
        List of ranked candidates with detailed breakdown
    """

    # Set defaults
    required_skills = required_skills or []
    required_certs = required_certs or []

    # Normalize inputs (lowercase for matching)
    required_skills = [s.lower().strip() for s in required_skills]
    required_certs = [c.strip() for c in required_certs]

    logger.info(f"🔍 Search Request:")
    logger.info(f"  Skills: {required_skills}")
    logger.info(f"  Certs: {required_certs}")
    logger.info(f"  Min Exp: {min_experience} years")
    logger.info(f"  Role: {role_title}")

    # Build embedding query (use summary + role + skills)
    embedding_query = f"{role_title} {requirement_summary} {' '.join(required_skills)}"
    logger.info(f"🔎 Embedding query: '{embedding_query[:100]}...'")

    # ---------------------------
    # LOAD DATA
    # ---------------------------
    bench_df = load_bench_status()
    employees_df, skills_df, certs_df, projects_df = load_csvs()

    # Merge to have all employee data in one place
    full_emp_df = employees_df.copy()

    if debug:
        logger.info(
            f"📊 Bench distribution: {bench_df['status'].value_counts().to_dict()}"
        )

    # ---------------------------
    # RETRIEVE CANDIDATES WITH EMBEDDINGS
    # ---------------------------
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    collection = client.get_collection(COLLECTION_NAME)

    query_embedding = get_embedding(embedding_query)

    # Wide retrieval window to get enough candidates after filtering
    retrieval_k = max(top_n * 6, 35)
    logger.info(f"🔄 Retrieving top {retrieval_k} candidates with embeddings")

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=retrieval_k,
        include=["metadatas", "distances"],
    )

    # ---------------------------
    # APPLY BENCH STATUS FILTER + BUILD MATCH LIST
    # ---------------------------
    candidates = []
    dropped_not_eligible = 0
    dropped_missing = 0

    for emp_id, metadata, distance in zip(
        results["ids"][0], results["metadatas"][0], results["distances"][0]
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
        emp_skills = skills_df[skills_df["employee_id"] == emp_id][
            "skill_name"
        ].tolist()
        emp_primary = str(emp_row.get("primary_skill", "")).lower()
        emp_role = str(emp_row.get("role", "")).lower()

        # Embedding-based score (convert distance to similarity)
        embedding_score = 1 - distance

        # ---------------------------
        # BOOST SIGNALS (BUSINESS LOGIC)
        # ---------------------------
        boost_factor = 1.0

        # SIGNAL 1: Exact role match (HIGHEST priority)
        role_lower = role_title.lower()
        if emp_role == role_lower:
            boost_factor *= 2.0
            if debug:
                logger.info(f"  🎯 {emp_id}: EXACT role match ({emp_role}) (×2.0)")

        # SIGNAL 2: Role word appears in employee role
        elif any(word in emp_role for word in role_lower.split() if len(word) > 2):
            boost_factor *= 1.5
            if debug:
                logger.info(f"  ✓ {emp_id}: Role keyword in '{emp_role}' (×1.5)")

        # SIGNAL 3: PRIMARY SKILL MATCHES REQUIRED SKILLS
        if emp_primary and any(skill in emp_primary for skill in required_skills):
            boost_factor *= 1.8
            if debug:
                logger.info(
                    f"  ⭐ {emp_id}: PRIMARY skill '{emp_primary}' matches (×1.8)"
                )

        # SIGNAL 4: ANY SKILL IN EMPLOYEE MATCHES REQUIRED SKILLS
        emp_skills_lower = [s.lower() for s in emp_skills]

        matching_skills = [
            s for s in emp_skills_lower if any(req in s for req in required_skills)
        ]
        if matching_skills:
            num_matches = len(matching_skills)
            skill_boost = min(1.0 + (num_matches * 0.3), 2.0)  # Cap at 2x
            boost_factor *= skill_boost
            if debug:
                logger.info(
                    f"  🔧 {emp_id}: Found {num_matches} matching skills (×{skill_boost:.1f})"
                )

        # Compute final score: embedding provides relevance, boosts apply field importance
        final_score = embedding_score * boost_factor

        candidates.append(
            {
                "employee_id": emp_id,
                "role": metadata.get("role", "Unknown"),
                "primary_skill": emp_primary,
                "bench_status": status,
                "embedding_score": round(embedding_score, 4),
                "boost_factor": round(boost_factor, 2),
                "final_score": round(final_score, 4),
            }
        )

    # ---------------------------
    # RE-RANK BY FINAL SCORE
    # ---------------------------
    candidates.sort(key=lambda x: x["final_score"], reverse=True)
    matches = candidates[:top_n]

    # ---------------------------
    # LLM ENRICHMENT WITH DETAILED BREAKDOWN
    # ---------------------------
    # Use gemma3:4b (faster) or llama3 with increased timeout
    try:
        llm = Ollama(model="gemma3:4b", request_timeout=120.0)
    except Exception as e:
        logger.warning(f"Failed to initialize Ollama: {e}")
        llm = None

    requirements = {
        "skills": required_skills,
        "certifications": required_certs,
        "experience_years": min_experience,
    }

    final_results = []

    for rank, match in enumerate(matches[:5], 1):
        emp_id = match["employee_id"]
        emp_row = full_emp_df[full_emp_df["employee_id"] == emp_id].iloc[0]

        # Get employee data
        emp_skills = skills_df[skills_df["employee_id"] == emp_id]
        emp_certs = certs_df[certs_df["employee_id"] == emp_id]
        emp_projects = projects_df[projects_df["employee_id"] == emp_id]

        # CALCULATE REAL BREAKDOWN
        skill_details, skills_match_pct = calculate_skill_matches(
            requirements["skills"], skills_df, emp_id
        )

        cert_details, certs_match_pct = calculate_cert_matches(
            requirements["certifications"], certs_df, emp_id
        )

        # Experience alignment
        candidate_exp = emp_row.get("experience_years", 0)
        required_exp = requirements["experience_years"]

        if required_exp > 0:
            exp_match_pct = min((candidate_exp / required_exp) * 100, 100)
        else:
            exp_match_pct = 80  # Default if no exp specified

        # Availability (bench = 100%, else lower)
        avail_pct = 100 if match["bench_status"] == "inactive" else 60

        # WEIGHTED SCORE (60% skills, 20% exp, 10% certs, 10% avail)
        weights = {
            "skills": 0.60,
            "experience": 0.20,
            "certifications": 0.10,
            "availability": 0.10,
        }

        overall_score = int(
            skills_match_pct * weights["skills"]
            + exp_match_pct * weights["experience"]
            + certs_match_pct * weights["certifications"]
            + avail_pct * weights["availability"]
        )

        # Build LLM prompt
        requirement_text = (
            f"{role_title} - {requirement_summary}"
            if requirement_summary
            else role_title
        )

        prompt = f"""You are an AI recruiter analyzing candidate fit.

**Requirement:** "{requirement_text}"
**Required Skills:** {', '.join(requirements['skills']) if requirements['skills'] else 'Not specified'}
**Required Experience:** {required_exp}+ years
**Required Certifications:** {', '.join(requirements['certifications']) if requirements['certifications'] else 'None specified'}

**Candidate #{rank}: {emp_row.get('name', emp_id)}**
Role: {match['role']}
Primary Skill: {match['primary_skill']}
Experience: {candidate_exp} years
Bench Status: {match['bench_status']}
Skills: {', '.join(emp_skills['skill_name'].head(5).tolist())}
Certifications: {', '.join(emp_certs['certificate_name'].tolist()) if not emp_certs.empty else 'None'}

**Breakdown Scores:**
- Skills Match: {skills_match_pct}% (matched {sum(1 for s in skill_details if s['confidence'] > 0)}/{len(skill_details)} required skills)
- Experience: {exp_match_pct:.0f}% ({candidate_exp} yrs vs {required_exp} yrs required)
- Availability: {avail_pct}% (bench status: {match['bench_status']})
- Certifications: {certs_match_pct}% ({len(requirements['certifications'])} required)

**Overall Fit: {overall_score}%**

Write a 2-sentence professional summary:
1. Why this candidate fits (highlight strengths).
2. Any gaps or concerns (if score < 80%).

Focus on facts. Be concise."""

        # LLM call with error handling
        llm_summary = ""
        if llm:
            try:
                response = llm.complete(prompt)
                llm_summary = str(response).strip()
            except Exception as e:
                logger.warning(f"LLM call failed for {emp_id}: {e}")
                llm_summary = f"Candidate with {overall_score}% overall fit. Skills match: {skills_match_pct}%, Experience: {candidate_exp} years."

        if not llm_summary:
            llm_summary = f"Candidate with {overall_score}% overall fit. Skills match: {skills_match_pct}%, Experience: {candidate_exp} years."

        # Prepare frontend payload (convert numpy types to native Python types)
        final_results.append(
            {
                "rank": int(rank),
                "employee_id": str(emp_id),
                "name": str(emp_row.get("name", f"Employee {emp_id}")),
                "email": str(emp_row.get("email", "")),
                "role": str(match["role"]),
                "bench_status": str(match["bench_status"]),
                "overall_fit_score": int(overall_score),
                # Breakdown scores
                "breakdown": {
                    "skills_match": int(skills_match_pct),
                    "experience_match": int(exp_match_pct),
                    "availability_match": int(avail_pct),
                    "certifications_match": int(certs_match_pct),
                    "certification_details": cert_details,
                },
                # Detailed skill matching table
                "skill_match_details": skill_details,
                # Experience alignment
                "experience_alignment": {
                    "required_years": int(required_exp),
                    "candidate_years": float(candidate_exp),
                    "exceeds_requirement": bool(candidate_exp >= required_exp),
                },
                # Project history
                "relevant_projects": (
                    [
                        {
                            "project_name": str(proj["project_name"]),
                            "experience_summary": str(proj["experience_summary"]),
                        }
                        for _, proj in emp_projects.iterrows()
                    ]
                    if not emp_projects.empty
                    else []
                ),
                # LLM reasoning
                "llm_summary": str(llm_summary),
                "ai_insight": str(llm_summary),  # Alias for frontend
                # Original score
                "similarity_score": float(match["final_score"]),
            }
        )

    logger.info(f"✓ Generated detailed breakdowns for {len(final_results)} candidates")
    return final_results


if __name__ == "__main__":
    ingest()
