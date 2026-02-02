# BenchMatch AI - Postman Testing Guide

Complete API testing guide with sample JSON requests for all endpoints.

**Base URL**: `http://127.0.0.1:8000`

---

## 📋 Testing Workflow (Recommended Order)

1. **Health Check** - Verify server is running
2. **Create Requirement** - Submit a new client requirement
3. **Search Candidates** - Run AI matching and create shortlist
4. **Get Requirements** - View all requirements
5. **Get Shortlist** - View matched candidates
6. **Get Breakdown** - Detailed candidate analysis
7. **Select Candidate** - Mark candidate as hired
8. **Update Status** - Manual status updates

---

## 1️⃣ Health Check Endpoints

### GET - Server Status
```
GET http://127.0.0.1:8000/
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "BenchMatch AI API is running"
}
```

### GET - Hello World
```
GET http://127.0.0.1:8000/hello-world
```

**Expected Response:**
```json
{
  "status": "ok"
}
```

---

## 2️⃣ Create New Requirement

### POST - Submit Client Requirement
```
POST http://127.0.0.1:8000/requirements
Content-Type: application/json
```

**Request Body:**
```json
{
  "client_name": "Acme Corporation",
  "role_title": "Senior Full Stack Engineer",
  "required_skills": [
    "React",
    "Node.js",
    "TypeScript",
    "AWS",
    "PostgreSQL"
  ],
  "minimum_experience": 5,
  "mandatory_certifications": [
    "AWS Solutions Architect",
    "Azure Fundamentals"
  ],
  "availability_date": "2026-02-15",
  "requirement_summary": "We need a senior full stack engineer with strong experience in React and Node.js to build a cloud-native SaaS application. The ideal candidate should have AWS certification and experience with microservices architecture."
}
```

**Expected Response:**
```json
{
  "status": "success",
  "requirement_id": "REQ-A1B2C3D4",
  "message": "Requirement created successfully for Acme Corporation",
  "data": {
    "requirement_id": "REQ-A1B2C3D4",
    "client_name": "Acme Corporation",
    "role_title": "Senior Full Stack Engineer",
    "status": "Submitted",
    "required_skills": ["React", "Node.js", "TypeScript", "AWS", "PostgreSQL"],
    "minimum_experience": 5,
    "mandatory_certifications": ["AWS Solutions Architect", "Azure Fundamentals"],
    "availability_date": "2026-02-15",
    "requirement_summary": "We need a senior full stack engineer..."
  }
}
```

**Save the `requirement_id` for next steps!**

---

## 3️⃣ Search & Match Candidates

### POST - AI-Powered Candidate Search
```
POST http://127.0.0.1:8000/search
Content-Type: application/json
```

**Request Body:**
```json
{
  "requirement_id": "REQ-A1B2C3D4",
  "client_name": "Acme Corporation",
  "role_title": "Senior Full Stack Engineer",
  "required_skills": [
    "React",
    "Node.js",
    "TypeScript",
    "AWS"
  ],
  "min_experience": 5,
  "required_certs": [
    "AWS Solutions Architect"
  ],
  "availability_date": "2026-02-15",
  "requirement_summary": "Senior full stack engineer for cloud-native SaaS application",
  "top_n": 5,
  "allow_partial": true
}
```

**Expected Response:**
```json
{
  "status": "success",
  "requirement_id": "REQ-A1B2C3D4",
  "client_name": "Acme Corporation",
  "role_title": "Senior Full Stack Engineer",
  "count": 5,
  "requirement_status": "In Progress",
  "matches": [
    {
      "rank": 1,
      "employee_id": "EMP001",
      "name": "John Doe",
      "email": "john.doe@company.com",
      "role": "Senior Full Stack Developer",
      "bench_status": "inactive",
      "overall_fit_score": 87,
      "breakdown": {
        "skills_match": 90,
        "experience_match": 85,
        "availability_match": 100,
        "certifications_match": 80,
        "certification_details": {
          "required": [
            {
              "certificate_name": "AWS Solutions Architect",
              "status": "✓ Met",
              "issued_by": ""
            }
          ],
          "additional": [
            {
              "certificate_name": "Azure Developer Associate",
              "status": "Held",
              "issued_by": "Microsoft"
            }
          ]
        }
      },
      "skill_match_details": [
        {
          "required_skill": "React",
          "candidate_evidence": "React (5 yrs)",
          "confidence": 95
        },
        {
          "required_skill": "Node.js",
          "candidate_evidence": "Node.js (4 yrs)",
          "confidence": 95
        },
        {
          "required_skill": "TypeScript",
          "candidate_evidence": "TypeScript (3 yrs)",
          "confidence": 95
        },
        {
          "required_skill": "AWS",
          "candidate_evidence": "AWS (4 yrs)",
          "confidence": 95
        }
      ],
      "experience_alignment": {
        "required_years": 5,
        "candidate_years": 6,
        "exceeds_requirement": true
      },
      "relevant_projects": [
        {
          "project_name": "E-commerce Platform",
          "experience_summary": "Led development of React-based frontend with Node.js microservices"
        }
      ],
      "llm_summary": "John is an excellent fit with 6 years of experience in full stack development, matching all required skills including React, Node.js, and AWS. He holds the required AWS Solutions Architect certification and has proven experience building scalable cloud applications.",
      "ai_insight": "John is an excellent fit...",
      "similarity_score": 0.8923
    }
  ]
}
```

---

## 4️⃣ Get Requirements

### GET - List All Requirements
```
GET http://127.0.0.1:8000/requirements
```

**Expected Response:**
```json
{
  "status": "success",
  "count": 3,
  "data": [
    {
      "requirement_id": "REQ-A1B2C3D4",
      "client_name": "Acme Corporation",
      "role_title": "Senior Full Stack Engineer",
      "status": "In Progress",
      "submitted_date": "2026-01-30T10:30:00",
      "min_experience": 5,
      "mandatory_certifications": ["AWS Solutions Architect", "Azure Fundamentals"],
      "availability_date": "2026-02-15",
      "summary": "We need a senior full stack engineer...",
      "required_skills": ["React", "Node.js", "TypeScript", "AWS", "PostgreSQL"],
      "matched_candidates": 5
    }
  ]
}
```

### GET - Filter Requirements by Status
```
GET http://127.0.0.1:8000/requirements?status=In Progress
```

**Valid Status Values:**
- `Submitted`
- `In Progress`
- `Matched`
- `Placed`

---

## 5️⃣ Get Specific Requirement

### GET - Requirement Details
```
GET http://127.0.0.1:8000/requirements/REQ-A1B2C3D4
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "requirement_id": "REQ-A1B2C3D4",
    "client_name": "Acme Corporation",
    "role_title": "Senior Full Stack Engineer",
    "status": "In Progress",
    "submitted_date": "2026-01-30T10:30:00",
    "min_experience": 5,
    "mandatory_certifications": ["AWS Solutions Architect", "Azure Fundamentals"],
    "availability_date": "2026-02-15",
    "summary": "We need a senior full stack engineer...",
    "required_skills": ["React", "Node.js", "TypeScript", "AWS", "PostgreSQL"]
  }
}
```

---

## 6️⃣ Get Candidate Shortlist

### GET - View Matched Candidates
```
GET http://127.0.0.1:8000/shortlist/REQ-A1B2C3D4
```

**Expected Response:**
```json
{
  "status": "success",
  "requirement_id": "REQ-A1B2C3D4",
  "data": {
    "candidate_count": 5,
    "generated_at": "2026-01-30T10:35:00",
    "candidates": [
      {
        "shortlist_item_id": "CSI-X1Y2Z3W4",
        "employee_id": "EMP001",
        "rank": 1,
        "overall_fit_score": 87,
        "skill_match_score": 90,
        "experience_score": 85,
        "availability_score": 100,
        "certifications_score": 80,
        "bench_status": "inactive",
        "reason_for_ranking": "Strong match on all required skills with AWS certification",
        "llm_summary": "John is an excellent fit with 6 years of experience...",
        "selected": 0,
        "name": "John Doe",
        "email": "john.doe@company.com",
        "role": "Senior Full Stack Developer",
        "experience_years": 6,
        "breakdown": {
          "skills_match": 90,
          "experience_match": 85,
          "availability_match": 100,
          "certifications_match": 80
        },
        "skill_match_details": [
          {
            "required_skill": "React",
            "candidate_evidence": "React (5 yrs)",
            "confidence": 95
          }
        ]
      }
    ]
  }
}
```

**Save the `shortlist_item_id` for candidate selection!**

---

## 7️⃣ Get Detailed Breakdown

### GET - Candidate Fit Analysis
```
GET http://127.0.0.1:8000/breakdown/REQ-A1B2C3D4/EMP001
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "shortlist_item_id": "CSI-X1Y2Z3W4",
    "employee_id": "EMP001",
    "name": "John Doe",
    "email": "john.doe@company.com",
    "role": "Senior Full Stack Developer",
    "experience_years": 6,
    "rank": 1,
    "overall_fit_score": 87,
    "skill_match_score": 90,
    "experience_score": 85,
    "availability_score": 100,
    "certifications_score": 80,
    "bench_status": "inactive",
    "reason_for_ranking": "Strong match on all required skills with AWS certification",
    "llm_summary": "John is an excellent fit with 6 years of experience in full stack development, matching all required skills including React, Node.js, and AWS. He holds the required AWS Solutions Architect certification and has proven experience building scalable cloud applications.",
    "selected": 0,
    "breakdown": {
      "skills_match": 90,
      "experience_match": 85,
      "availability_match": 100,
      "certifications_match": 80,
      "certification_details": {
        "required": [
          {
            "certificate_name": "AWS Solutions Architect",
            "status": "✓ Met",
            "issued_by": ""
          }
        ],
        "additional": [
          {
            "certificate_name": "Azure Developer Associate",
            "status": "Held",
            "issued_by": "Microsoft"
          }
        ]
      }
    }
  }
}
```

---

## 8️⃣ Select Candidate (Mark as Hired)

### PUT - Select Candidate for Requirement
```
PUT http://127.0.0.1:8000/candidate/CSI-X1Y2Z3W4/select
Content-Type: application/json
```

**Request Body (Optional):**
```json
{
  "hired_by": "Jane Smith - Talent Manager"
}
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Candidate selected successfully",
  "requirement_id": "REQ-A1B2C3D4",
  "employee_id": "EMP001",
  "requirement_status": "Matched"
}
```

**What This Does:**
- Marks candidate as `selected = 1` in `candidate_shortlist_items`
- Updates requirement status to `Matched`
- Updates `bench_status` to `allocated`
- Records selection in `match_history` table

---

## 9️⃣ Update Requirement Status

### PUT - Manual Status Update
```
PUT http://127.0.0.1:8000/requirement/REQ-A1B2C3D4/status?new_status=Placed
```

**Query Parameters:**
- `new_status` (required): One of `Submitted`, `In Progress`, `Matched`, `Placed`

**Expected Response:**
```json
{
  "status": "success",
  "message": "Requirement status updated to Placed",
  "requirement_id": "REQ-A1B2C3D4",
  "requirement_status": "Placed"
}
```

---

## 🧪 Complete Test Scenario

### Test Case 1: End-to-End Workflow

**Step 1**: Create requirement
```bash
POST /requirements
# Save requirement_id from response
```

**Step 2**: Search candidates
```bash
POST /search
# Use requirement_id from Step 1
# Save shortlist_item_id from top candidate
```

**Step 3**: View all requirements
```bash
GET /requirements
# Verify status is "In Progress"
```

**Step 4**: View shortlist
```bash
GET /shortlist/{requirement_id}
# Review all matched candidates
```

**Step 5**: Get detailed breakdown
```bash
GET /breakdown/{requirement_id}/{employee_id}
# Deep dive into top candidate
```

**Step 6**: Select candidate
```bash
PUT /candidate/{shortlist_item_id}/select
# Verify status changes to "Matched"
```

**Step 7**: Update to Placed
```bash
PUT /requirement/{requirement_id}/status?new_status=Placed
# Mark as successfully placed
```

---

## 🔧 Additional Test Cases

### Test Case 2: Frontend Developer Role
```json
{
  "client_name": "TechStart Inc",
  "role_title": "React Frontend Developer",
  "required_skills": ["React", "JavaScript", "CSS", "Redux"],
  "minimum_experience": 3,
  "mandatory_certifications": [],
  "availability_date": "2026-03-01",
  "requirement_summary": "Looking for a React specialist to build modern web interfaces"
}
```

### Test Case 3: DevOps Engineer
```json
{
  "client_name": "CloudOps Ltd",
  "role_title": "Senior DevOps Engineer",
  "required_skills": ["Kubernetes", "Docker", "AWS", "Terraform", "CI/CD"],
  "minimum_experience": 6,
  "mandatory_certifications": ["AWS Solutions Architect", "Kubernetes CKA"],
  "availability_date": "2026-02-20",
  "requirement_summary": "DevOps engineer to manage cloud infrastructure and automate deployments"
}
```

### Test Case 4: Python Backend Developer
```json
{
  "client_name": "DataCorp",
  "role_title": "Python Backend Developer",
  "required_skills": ["Python", "Django", "PostgreSQL", "Redis", "FastAPI"],
  "minimum_experience": 4,
  "mandatory_certifications": [],
  "availability_date": "2026-03-15",
  "requirement_summary": "Backend developer for high-performance API development"
}
```

---

## 🚨 Error Responses

### 404 - Not Found
```json
{
  "detail": "Requirement REQ-INVALID not found"
}
```

### 400 - Bad Request
```json
{
  "detail": "Invalid status. Must be one of: ['Submitted', 'In Progress', 'Matched', 'Placed']"
}
```

### 500 - Server Error
```json
{
  "detail": "Database error: Connection timeout"
}
```

---

## 📦 Import to Postman

### Method 1: Manual Collection Creation
1. Create new collection: "BenchMatch AI"
2. Add folder: "Health Checks"
3. Add folder: "Requirements"
4. Add folder: "Search & Shortlist"
5. Add folder: "Candidate Selection"
6. Copy each endpoint from this guide

### Method 2: Environment Variables
Create a Postman environment with:
```
BASE_URL = http://127.0.0.1:8000
REQUIREMENT_ID = REQ-A1B2C3D4
SHORTLIST_ITEM_ID = CSI-X1Y2Z3W4
EMPLOYEE_ID = EMP001
```

Then use `{{BASE_URL}}/requirements` in requests.

---

## ✅ Testing Checklist

- [ ] Server health check passes
- [ ] Create requirement returns 201/success
- [ ] Search generates shortlist with 5 candidates
- [ ] All candidates have LLM summaries
- [ ] Skill matching scores are calculated
- [ ] Shortlist retrieval shows all candidates
- [ ] Breakdown shows detailed analysis
- [ ] Candidate selection updates status to "Matched"
- [ ] Bench status changes to "allocated"
- [ ] Manual status update works
- [ ] Filter by status works
- [ ] Error handling for invalid IDs

---

## 🔍 Debugging Tips

**If search returns no results:**
- Check if ChromaDB has embeddings: `ls backend/chroma_data/`
- Run data ingestion: `python main.py ingest`
- Verify NOMIC_API_KEY in `.env`

**If database errors occur:**
- Check Azure SQL connection: `test_azure_connection.py`
- Run schema updates: `AZURE_SQL_SCHEMA_UPDATES.sql`
- Verify Entra ID authentication

**If LLM summaries are empty:**
- Check Ollama is running: `ollama list`
- Pull Llama3: `ollama pull llama3`
- Test: `ollama run llama3 "test"`

---

## 📞 Support

For issues or questions:
- Check logs: Server terminal output
- API docs: http://127.0.0.1:8000/docs
- Schema: `AZURE_SQL_SCHEMA_UPDATES.sql`
- Setup: `SETUP_GUIDE.md`

---

**Last Updated**: January 30, 2026
**API Version**: 1.0.0
