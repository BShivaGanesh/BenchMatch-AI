from fastapi import FastAPI
from data_ingestion import ingest, search_employees
import logging
from pydantic import BaseModel
from typing import List, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()


# Pydantic model for request validation
class SearchRequest(BaseModel):
    client_name: Optional[str] = ""
    role_title: str
    required_skills: List[str]
    min_experience: int = 0
    required_certs: Optional[List[str]] = []
    availability_date: Optional[str] = None
    requirement_summary: Optional[str] = ""
    top_n: Optional[int] = 5
    allow_partial: Optional[bool] = True


@app.get("/hello-world")
def hello_world():
    return {"status": "ok"}


@app.post("/search")
def search(request: SearchRequest):
    """
    Semantic search endpoint with structured form inputs.

    Example request body:
    {
      "client_name": "Global Retail Corp",
      "role_title": "Senior Full Stack Engineer",
      "required_skills": ["React", "Node.js", "AWS", "PostgreSQL"],
      "min_experience": 5,
      "required_certs": ["AWS Solutions Architect", "Azure DP-203"],
      "requirement_summary": "Greenfield loyalty platform rebuild...",
      "top_n": 5
    }
    """
    try:
        results = search_employees(
            required_skills=request.required_skills,
            required_certs=request.required_certs or [],
            min_experience=request.min_experience,
            role_title=request.role_title,
            requirement_summary=request.requirement_summary or "",
            top_n=request.top_n,
            allow_partial=request.allow_partial,
        )

        return {
            "status": "success",
            "client_name": request.client_name,
            "role_title": request.role_title,
            "matches": results,
            "count": len(results),
        }
    except Exception as e:
        logger.error(f"Search error: {e}")
        return {"status": "failed", "error": str(e)}


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
        # CLI test with structured inputs
        logger.info("Testing search with structured inputs...")

        results = search_employees(
            required_skills=["React", "AWS", "Frontend", "Tailwind CSS"],
            required_certs=["AWS Solutions Architect"],
            min_experience=8,
            role_title="Frontend Developer",
            requirement_summary="React frontend development with AWS integration",
            top_n=5,
        )

        if results:
            print("\n" + "=" * 90)
            print("BENCH-ELIGIBLE EMPLOYEE MATCHES WITH DETAILED AI BREAKDOWN")
            print("=" * 90)

            for candidate in results:
                print(f"\n{'='*90}")
                print(
                    f"RANK #{candidate['rank']} | {candidate['name']} ({candidate['employee_id']})"
                )
                print(
                    f"Role: {candidate['role']} | Email: {candidate.get('email', 'N/A')}"
                )
                print(
                    f"Bench: {candidate['bench_status']} | Overall Fit: {candidate['overall_fit_score']}%"
                )
                print(f"{'-' * 90}")

                # Breakdown
                b = candidate["breakdown"]
                print(f"  Skills Match:      {b['skills_match']}%")
                print(f"  Experience:        {b['experience_match']}%")
                print(f"  Availability:      {b['availability_match']}%")
                print(f"  Certifications:    {b['certifications_match']}%")
                print(f"{'-' * 90}")

                # Skill details
                print("SKILL MATCH DETAILS:")
                for skill in candidate["skill_match_details"]:
                    print(
                        f"  {skill['required_skill']:20} | {skill['candidate_evidence']:35} | {skill['confidence']}% match"
                    )

                # Experience
                exp = candidate["experience_alignment"]
                status = "✓ Exceeds" if exp["exceeds_requirement"] else "⚠ Below"
                print(
                    f"\nEXPERIENCE: {status} | Required: {exp['required_years']} yrs | Candidate: {exp['candidate_years']} yrs"
                )

                # Certifications
                print(f"\nCERTIFICATION BREAKDOWN:")
                cert_details = candidate["breakdown"].get(
                    "certification_details", {"required": [], "additional": []}
                )

                if cert_details["required"]:
                    print("  REQUIRED CERTIFICATIONS:")
                    for cert in cert_details["required"]:
                        print(f"    {cert['status']} {cert['certificate_name']}")
                else:
                    print("  REQUIRED CERTIFICATIONS: None specified")

                if cert_details["additional"]:
                    print("\n  ADDITIONAL CERTIFICATIONS:")
                    for cert in cert_details["additional"]:
                        print(
                            f"    + {cert['certificate_name']} (by {cert['issued_by']})"
                        )

                # Projects
                if candidate.get("relevant_projects"):
                    print(f"\nRELEVANT PROJECTS:")
                    for proj in candidate["relevant_projects"][:2]:
                        print(
                            f"  - {proj['project_name']}: {proj['experience_summary'][:60]}..."
                        )

                print(f"{'-' * 90}")
                print(f"AI INSIGHT:\n  {candidate['llm_summary']}")
                print(f"{'=' * 90}")
        else:
            print("No bench-eligible candidates found.")

    else:
        print("Usage:")
        print("  python main.py ingest           # Run data ingestion")
        print("  python main.py search           # Test search with sample data")
        print("\nAPI Server:")
        print("  uvicorn main:app --reload       # Start FastAPI server")
        print("  POST /search                    # Structured search endpoint")
