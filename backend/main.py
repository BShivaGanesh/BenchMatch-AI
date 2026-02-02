from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from data_ingestion import ingest, search_employees, get_engine
import logging
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import uuid
from datetime import datetime
from sqlalchemy import text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="BenchMatch AI API", version="1.0.0")

# ========================================
# CORS MIDDLEWARE
# ========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================================
# AZURE SQL HELPER FUNCTIONS
# ========================================

def execute_query(query: str, params: Dict[str, Any] = None):
    """Execute INSERT/UPDATE/DELETE query on Azure SQL."""
    try:
        engine = get_engine()
        with engine.connect() as conn:
            result = conn.execute(text(query), params or {})
            conn.commit()
            return result
    except Exception as e:
        logger.error(f"Database execute error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def fetch_query(query: str, params: Dict[str, Any] = None):
    """Execute SELECT query on Azure SQL and return results."""
    try:
        engine = get_engine()
        with engine.connect() as conn:
            result = conn.execute(text(query), params or {})
            columns = result.keys()
            rows = result.fetchall()
            return [dict(zip(columns, row)) for row in rows]
    except Exception as e:
        logger.error(f"Database fetch error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ========================================
# PYDANTIC MODELS
# ========================================

class SearchRequest(BaseModel):
    requirement_id: Optional[str] = None  # Add requirement_id for storing results
    client_name: Optional[str] = ""
    role_title: str
    required_skills: List[str]
    min_experience: int = 0
    required_certs: Optional[List[str]] = []
    availability_date: Optional[str] = None
    requirement_summary: Optional[str] = ""
    top_n: Optional[int] = 5
    allow_partial: Optional[bool] = True


class CreateRequirementRequest(BaseModel):
    """Request body for creating a new requirement."""
    client_name: str
    role_title: str
    required_skills: List[str]
    minimum_experience: int
    mandatory_certifications: List[str]
    availability_date: Optional[str] = None
    requirement_summary: str


class SelectCandidateRequest(BaseModel):
    """Request body for selecting a candidate."""
    hired_by: Optional[str] = None


@app.get("/")
def root():
    return {"status": "ok", "message": "BenchMatch AI API is running"}


@app.get("/hello-world")
def hello_world():
    return {"status": "ok"}


# ========================================
# POST ENDPOINTS - CREATE/STORE DATA
# ========================================

@app.post("/requirements")
def create_requirement(request: CreateRequirementRequest):
    """
    POST /requirements
    Create a new client project requirement and store in Azure SQL.
    
    Stores to: bench.client_requirements
    """
    try:
        # Generate unique requirement ID
        requirement_id = f"REQ-{str(uuid.uuid4())[:8].upper()}"
        
        # Convert lists to comma-separated strings
        required_skills_str = ",".join(request.required_skills)
        mandatory_certs_str = ",".join(request.mandatory_certifications)
        
        # Insert into client_requirements table
        insert_query = """
            INSERT INTO bench.client_requirements (
                requirement_id, client_name, role_title, status, 
                submitted_date, min_experience, mandatory_certs, 
                availability_date, summary, required_skills
            ) VALUES (
                :req_id, :client_name, :role_title, 'Submitted',
                GETDATE(), :min_exp, :certs, :avail_date, :summary, :skills
            )
        """
        
        execute_query(insert_query, {
            "req_id": requirement_id,
            "client_name": request.client_name,
            "role_title": request.role_title,
            "min_exp": request.minimum_experience,
            "certs": mandatory_certs_str,
            "avail_date": request.availability_date or None,
            "summary": request.requirement_summary,
            "skills": required_skills_str
        })
        
        logger.info(f"✓ Created requirement {requirement_id} for {request.client_name}")
        
        return {
            "status": "success",
            "requirement_id": requirement_id,
            "message": f"Requirement created successfully for {request.client_name}",
            "data": {
                "requirement_id": requirement_id,
                "client_name": request.client_name,
                "role_title": request.role_title,
                "status": "Submitted",
                "required_skills": request.required_skills,
                "minimum_experience": request.minimum_experience,
                "mandatory_certifications": request.mandatory_certifications,
                "availability_date": request.availability_date,
                "requirement_summary": request.requirement_summary
            }
        }
    except Exception as e:
        logger.error(f"Error creating requirement: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search")
def search(request: SearchRequest):
    """
    POST /search
    Semantic search endpoint - Stores results to Azure SQL.
    
    Flow:
    1. Run embedding search to find matching candidates
    2. Store shortlist in bench.candidate_shortlists
    3. Store each candidate in bench.candidate_shortlist_items
    4. Update requirement status to 'In Progress'
    """
    try:
        # Run the search
        results = search_employees(
            required_skills=request.required_skills,
            required_certs=request.required_certs or [],
            min_experience=request.min_experience,
            role_title=request.role_title,
            requirement_summary=request.requirement_summary or "",
            top_n=request.top_n,
            allow_partial=request.allow_partial,
        )
        
        # If requirement_id provided, store results to database
        if request.requirement_id:
            try:
                # Generate shortlist ID
                shortlist_id = f"SL-{str(uuid.uuid4())[:8].upper()}"
                
                # Insert into candidate_shortlists
                insert_shortlist = """
                    INSERT INTO bench.candidate_shortlists (
                        shortlist_id, requirement_id, generated_at, 
                        engine_version, total_candidates
                    ) VALUES (
                        :sl_id, :req_id, GETDATE(), '1.0', :count
                    )
                """
                execute_query(insert_shortlist, {
                    "sl_id": shortlist_id,
                    "req_id": request.requirement_id,
                    "count": len(results)
                })
                
                # Insert each candidate into candidate_shortlist_items
                for candidate in results:
                    item_id = f"CSI-{str(uuid.uuid4())[:8].upper()}"
                    
                    # Extract breakdown scores
                    breakdown = candidate.get("breakdown", {})
                    
                    # Prepare strengths - summarize skill matches (truncate for DB column limit)
                    skill_details = candidate.get("skill_match_details", [])
                    strengths_summary = ", ".join([
                        s.get("required_skill", "") for s in skill_details 
                        if s.get("confidence", 0) > 0
                    ])[:450] or "No matching skills found"
                    
                    # Prepare gaps - skills not matched
                    gaps_summary = ", ".join([
                        s.get("required_skill", "") for s in skill_details 
                        if s.get("confidence", 0) == 0
                    ])[:450] or ""
                    
                    insert_item = """
                        INSERT INTO bench.candidate_shortlist_items (
                            shortlist_item_id, shortlist_id, employee_id, rank,
                            overall_fit_score, skill_match_score, experience_score,
                            availability_score, certifications_score, bench_status,
                            reason_for_ranking, strengths, gaps, 
                            llm_summary, llm_breakdown_json, selected
                        ) VALUES (
                            :item_id, :sl_id, :emp_id, :rank,
                            :overall_fit, :skill_match, :exp_match,
                            :avail_match, :cert_match, :bench_status,
                            :reason, :strengths, :gaps,
                            :llm_summary, :llm_json, 0
                        )
                    """
                    
                    execute_query(insert_item, {
                        "item_id": item_id,
                        "sl_id": shortlist_id,
                        "emp_id": candidate["employee_id"],
                        "rank": int(candidate["rank"]),
                        "overall_fit": int(candidate["overall_fit_score"]),
                        "skill_match": int(breakdown.get("skills_match", 0)),
                        "exp_match": int(breakdown.get("experience_match", 0)),
                        "avail_match": int(breakdown.get("availability_match", 0)),
                        "cert_match": int(breakdown.get("certifications_match", 0)),
                        "bench_status": str(candidate["bench_status"]),
                        "reason": str(candidate.get("llm_summary", ""))[:200],
                        "strengths": strengths_summary,
                        "gaps": gaps_summary,
                        "llm_summary": str(candidate.get("llm_summary", "")),
                        "llm_json": json.dumps(breakdown)
                    })
                
                # Update requirement status to 'In Progress'
                update_status = """
                    UPDATE bench.client_requirements 
                    SET status = 'In Progress', updated_date = GETDATE()
                    WHERE requirement_id = :req_id
                """
                execute_query(update_status, {"req_id": request.requirement_id})
                
                logger.info(f"✓ Stored {len(results)} candidates to shortlist {shortlist_id}")
                
            except Exception as e:
                logger.error(f"Error storing shortlist: {e}")
                # Continue even if storage fails
        
        return {
            "status": "success",
            "requirement_id": request.requirement_id,
            "client_name": request.client_name,
            "role_title": request.role_title,
            "matches": results,
            "count": len(results),
            "requirement_status": "In Progress" if request.requirement_id else "Not Stored"
        }
    except Exception as e:
        logger.error(f"Search error: {e}")
        return {"status": "failed", "error": str(e)}


# ========================================
# GET ENDPOINTS - RETRIEVE DATA
# ========================================

@app.get("/requirements")
def get_all_requirements(status: Optional[str] = None):
    """
    GET /requirements
    Retrieve all client requirements from Azure SQL.
    Optional filter by status: Submitted, In Progress, Matched, Placed
    """
    try:
        query = """
            SELECT 
                cr.requirement_id, cr.client_name, cr.role_title, cr.status,
                cr.submitted_date, cr.min_experience, cr.mandatory_certs,
                cr.availability_date, cr.summary, cr.required_skills,
                COUNT(DISTINCT csi.employee_id) as matched_candidates
            FROM bench.client_requirements cr
            LEFT JOIN bench.candidate_shortlists cs ON cr.requirement_id = cs.requirement_id
            LEFT JOIN bench.candidate_shortlist_items csi ON cs.shortlist_id = csi.shortlist_id
        """
        
        params = {}
        if status:
            query += " WHERE cr.status = :status"
            params["status"] = status
        
        query += """
            GROUP BY cr.requirement_id, cr.client_name, cr.role_title, cr.status,
                     cr.submitted_date, cr.min_experience, cr.mandatory_certs,
                     cr.availability_date, cr.summary, cr.required_skills
            ORDER BY cr.submitted_date DESC
        """
        
        requirements = fetch_query(query, params)
        
        # Convert required_skills and mandatory_certs to lists
        for req in requirements:
            if req.get("required_skills"):
                req["required_skills"] = req["required_skills"].split(",")
            if req.get("mandatory_certs"):
                req["mandatory_certifications"] = req["mandatory_certs"].split(",")
        
        return {
            "status": "success",
            "count": len(requirements),
            "data": requirements
        }
    except Exception as e:
        logger.error(f"Error retrieving requirements: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/requirements/{requirement_id}")
def get_requirement(requirement_id: str):
    """
    GET /requirements/{requirement_id}
    Retrieve a specific requirement by ID.
    """
    try:
        query = """
            SELECT * FROM bench.client_requirements
            WHERE requirement_id = :req_id
        """
        
        results = fetch_query(query, {"req_id": requirement_id})
        
        if not results:
            raise HTTPException(status_code=404, detail=f"Requirement {requirement_id} not found")
        
        requirement = results[0]
        
        # Convert strings to lists
        if requirement.get("required_skills"):
            requirement["required_skills"] = requirement["required_skills"].split(",")
        if requirement.get("mandatory_certs"):
            requirement["mandatory_certifications"] = requirement["mandatory_certs"].split(",")
        
        return {
            "status": "success",
            "data": requirement
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving requirement: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/shortlist/{requirement_id}")
def get_shortlist(requirement_id: str):
    """
    GET /shortlist/{requirement_id}
    Retrieve candidate shortlist for a specific requirement.
    """
    try:
        # Get shortlist with all candidate details
        query = """
            SELECT 
                csi.shortlist_item_id, csi.employee_id, csi.rank,
                csi.overall_fit_score, csi.skill_match_score, 
                csi.experience_score, csi.availability_score,
                csi.certifications_score, csi.bench_status,
                csi.reason_for_ranking, csi.strengths, csi.gaps,
                csi.llm_summary, csi.llm_breakdown_json, csi.selected,
                e.name, e.email, e.role, e.experience_years,
                cs.generated_at, cs.total_candidates
            FROM bench.candidate_shortlists cs
            JOIN bench.candidate_shortlist_items csi ON cs.shortlist_id = csi.shortlist_id
            JOIN bench.employees e ON csi.employee_id = e.employee_id
            WHERE cs.requirement_id = :req_id
            ORDER BY csi.rank
        """
        
        candidates = fetch_query(query, {"req_id": requirement_id})
        
        if not candidates:
            raise HTTPException(status_code=404, detail=f"Shortlist for requirement {requirement_id} not found")
        
        # Parse JSON fields
        for candidate in candidates:
            if candidate.get("llm_breakdown_json"):
                try:
                    candidate["breakdown"] = json.loads(candidate["llm_breakdown_json"])
                except:
                    candidate["breakdown"] = {}
            if candidate.get("strengths"):
                try:
                    candidate["skill_match_details"] = json.loads(candidate["strengths"])
                except:
                    candidate["skill_match_details"] = []
        
        return {
            "status": "success",
            "requirement_id": requirement_id,
            "data": {
                "candidates": candidates,
                "candidate_count": len(candidates),
                "generated_at": candidates[0]["generated_at"] if candidates else None
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving shortlist: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/breakdown/{requirement_id}/{employee_id}")
def get_breakdown(requirement_id: str, employee_id: str):
    """
    GET /breakdown/{requirement_id}/{employee_id}
    Retrieve detailed breakdown for a specific candidate.
    """
    try:
        query = """
            SELECT 
                csi.*, e.name, e.email, e.role, e.experience_years
            FROM bench.candidate_shortlists cs
            JOIN bench.candidate_shortlist_items csi ON cs.shortlist_id = csi.shortlist_id
            JOIN bench.employees e ON csi.employee_id = e.employee_id
            WHERE cs.requirement_id = :req_id AND csi.employee_id = :emp_id
        """
        
        results = fetch_query(query, {"req_id": requirement_id, "emp_id": employee_id})
        
        if not results:
            raise HTTPException(
                status_code=404, 
                detail=f"Breakdown not found for requirement {requirement_id} and candidate {employee_id}"
            )
        
        breakdown = results[0]
        
        # Parse JSON fields
        if breakdown.get("llm_breakdown_json"):
            try:
                breakdown["breakdown"] = json.loads(breakdown["llm_breakdown_json"])
            except:
                breakdown["breakdown"] = {}
        
        return {
            "status": "success",
            "data": breakdown
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving breakdown: {e}")
        raise HTTPException(status_code=500, detail=str(e))





# ========================================
# PUT ENDPOINTS - UPDATE DATA
# ========================================

@app.put("/candidate/{shortlist_item_id}/select")
def select_candidate(shortlist_item_id: str, request: SelectCandidateRequest = None):
    """
    PUT /candidate/{shortlist_item_id}/select
    Mark a candidate as selected/hired for a requirement.
    
    Updates:
    - candidate_shortlist_items.selected = 1
    - client_requirements.status = 'Matched'
    - bench_status to mark employee as allocated
    - match_history to record the selection
    """
    try:
        engine = get_engine()
        
        # Use transaction for atomicity
        with engine.begin() as conn:
            # 1. Get shortlist item details
            get_item = text("""
                SELECT csi.shortlist_item_id, csi.shortlist_id, csi.employee_id, 
                       csi.overall_fit_score, cs.requirement_id
                FROM bench.candidate_shortlist_items csi
                JOIN bench.candidate_shortlists cs ON csi.shortlist_id = cs.shortlist_id
                WHERE csi.shortlist_item_id = :item_id
            """)
            result = conn.execute(get_item, {"item_id": shortlist_item_id}).first()
            
            if not result:
                raise HTTPException(status_code=404, detail=f"Shortlist item {shortlist_item_id} not found")
            
            requirement_id = result[4]
            employee_id = result[2]
            fit_score = result[3]
            
            # 2. Update candidate_shortlist_items - Mark as selected
            update_item = text("""
                UPDATE bench.candidate_shortlist_items 
                SET selected = 1, 
                    selected_date = GETDATE()
                WHERE shortlist_item_id = :item_id
            """)
            conn.execute(update_item, {"item_id": shortlist_item_id})
            
            # 3. Update client_requirements status to 'Matched'
            update_req = text("""
                UPDATE bench.client_requirements 
                SET status = 'Matched', 
                    updated_date = GETDATE()
                WHERE requirement_id = :req_id
            """)
            conn.execute(update_req, {"req_id": requirement_id})
            
            # 4. Update bench_status - Mark employee as allocated
            update_bench = text("""
                UPDATE bench.bench_status 
                SET status = 'allocated',
                    allocated_to_requirement_id = :req_id,
                    allocated_date = GETDATE()
                WHERE employee_id = :emp_id
            """)
            conn.execute(update_bench, {"req_id": requirement_id, "emp_id": employee_id})
            
            # 5. Record in match_history
            match_run_id = f"MH-{str(uuid.uuid4())[:8].upper()}"
            insert_history = text("""
                INSERT INTO bench.match_history 
                (match_run_id, requirement_id, run_timestamp, status, 
                 top_candidate_id, top_candidate_fit, engine_version)
                VALUES (
                    :match_id, :req_id, GETDATE(), 'Matched',
                    :emp_id, :fit_score, '1.0'
                )
            """)
            conn.execute(insert_history, {
                "match_id": match_run_id,
                "req_id": requirement_id, 
                "emp_id": employee_id,
                "fit_score": fit_score
            })
        
        logger.info(f"✓ Candidate {employee_id} selected for requirement {requirement_id}")
        
        return {
            "status": "success",
            "message": "Candidate selected successfully",
            "requirement_id": requirement_id,
            "employee_id": employee_id,
            "requirement_status": "Matched"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error selecting candidate: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/requirement/{requirement_id}/status")
def update_requirement_status(requirement_id: str, new_status: str):
    """
    PUT /requirement/{requirement_id}/status
    Update requirement status: Submitted, In Progress, Matched, Placed
    """
    try:
        valid_statuses = ["Submitted", "In Progress", "Matched", "Placed"]
        if new_status not in valid_statuses:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid status. Must be one of: {valid_statuses}"
            )
        
        update_query = """
            UPDATE bench.client_requirements 
            SET status = :status, 
                updated_date = GETDATE()
            WHERE requirement_id = :req_id
        """
        execute_query(update_query, {"status": new_status, "req_id": requirement_id})
        
        logger.info(f"✓ Requirement {requirement_id} status updated to {new_status}")
        
        return {
            "status": "success",
            "message": f"Requirement status updated to {new_status}",
            "requirement_id": requirement_id,
            "requirement_status": new_status
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating requirement status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========================================
# TEST FUNCTIONS
# ========================================
if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "ingest":
        logger.info("Starting data ingestion...")
        ingest()
        logger.info("Ingestion complete!")
    else:
        print("Usage:")
        print("  python main.py ingest           # Run data ingestion")
        print("\nAPI Server:")
        print("  python -m uvicorn main:app --reload       # Start FastAPI server")
