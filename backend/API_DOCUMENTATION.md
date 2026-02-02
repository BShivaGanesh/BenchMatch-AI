# BenchMatch AI - Backend API Documentation

## Overview

The Backend API provides REST endpoints to manage client project requirements, search for candidate matches, and store detailed breakdowns of candidate suitability.

---

## Base URL

```
http://localhost:8000
```

## Endpoints

### 1. POST /requirements
**Create a new client project requirement**

**Request Body:**
```json
{
  "client_name": "Global Retail Corp",
  "role_title": "Senior Full Stack Engineer",
  "required_skills": ["React", "Node.js", "AWS", "PostgreSQL"],
  "minimum_experience": 5,
  "mandatory_certifications": ["AWS Solutions Architect", "Azure DP-203"],
  "availability_date": "2026-03-01",
  "requirement_summary": "Greenfield loyalty platform rebuild. Need experienced full stack engineer with cloud expertise for a 6-month project."
}
```

**Response:**
```json
{
  "status": "success",
  "requirement_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Requirement created successfully for Global Retail Corp",
  "data": {
    "requirement_id": "550e8400-e29b-41d4-a716-446655440000",
    "client_name": "Global Retail Corp",
    "role_title": "Senior Full Stack Engineer",
    "required_skills": ["React", "Node.js", "AWS", "PostgreSQL"],
    "minimum_experience": 5,
    "mandatory_certifications": ["AWS Solutions Architect", "Azure DP-203"],
    "availability_date": "2026-03-01",
    "requirement_summary": "...",
    "created_at": "2026-01-28T10:30:00.000000"
  }
}
```

---

### 2. GET /requirements
**Retrieve all stored client requirements**

**Response:**
```json
{
  "status": "success",
  "count": 3,
  "data": [
    {
      "requirement_id": "550e8400-e29b-41d4-a716-446655440000",
      "client_name": "Global Retail Corp",
      "role_title": "Senior Full Stack Engineer",
      "required_skills": ["React", "Node.js", "AWS", "PostgreSQL"],
      "minimum_experience": 5,
      "mandatory_certifications": ["AWS Solutions Architect", "Azure DP-203"],
      "availability_date": "2026-03-01",
      "requirement_summary": "...",
      "created_at": "2026-01-28T10:30:00.000000"
    }
  ]
}
```

---

### 3. GET /requirements/{requirement_id}
**Retrieve a specific requirement by ID**

**Path Parameters:**
- `requirement_id` (string, UUID): The unique identifier of the requirement

**Response:**
```json
{
  "status": "success",
  "data": {
    "requirement_id": "550e8400-e29b-41d4-a716-446655440000",
    "client_name": "Global Retail Corp",
    "role_title": "Senior Full Stack Engineer",
    ...
  }
}
```

---

### 4. POST /shortlist
**Store candidate shortlist for a requirement**

**Request Body:**
```json
{
  "requirement_id": "550e8400-e29b-41d4-a716-446655440000",
  "candidates": [
    {
      "rank": 1,
      "candidate_id": "EMP001",
      "name": "Alice Johnson",
      "role": "Senior Full Stack Engineer",
      "overall_fit_score": 92,
      "bench_status": "inactive",
      "email": "alice.johnson@company.com"
    },
    {
      "rank": 2,
      "candidate_id": "EMP002",
      "name": "Bob Smith",
      "role": "Full Stack Engineer",
      "overall_fit_score": 85,
      "bench_status": "inactive",
      "email": "bob.smith@company.com"
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "requirement_id": "550e8400-e29b-41d4-a716-446655440000",
  "candidate_count": 2,
  "message": "Shortlist stored for 2 candidates"
}
```

---

### 5. GET /shortlist/{requirement_id}
**Retrieve candidate shortlist for a requirement**

**Path Parameters:**
- `requirement_id` (string, UUID): The unique identifier of the requirement

**Response:**
```json
{
  "status": "success",
  "data": {
    "requirement_id": "550e8400-e29b-41d4-a716-446655440000",
    "candidates": [
      {
        "rank": 1,
        "candidate_id": "EMP001",
        "name": "Alice Johnson",
        "role": "Senior Full Stack Engineer",
        "overall_fit_score": 92,
        "bench_status": "inactive",
        "email": "alice.johnson@company.com"
      }
    ],
    "stored_at": "2026-01-28T10:35:00.000000",
    "candidate_count": 2
  }
}
```

---

### 6. POST /breakdown
**Store detailed LLM breakdown analysis for a candidate**

**Request Body:**
```json
{
  "requirement_id": "550e8400-e29b-41d4-a716-446655440000",
  "candidate_id": "EMP001",
  "candidate_name": "Alice Johnson",
  "breakdown": {
    "skills_match": 95,
    "experience_match": 90,
    "certifications_match": 100,
    "availability_match": 100
  },
  "llm_summary": "Alice is an excellent fit for this role. She has 8 years of full stack experience with strong React and Node.js expertise. Holds AWS Solutions Architect certification. Available immediately and has led similar platform migration projects."
}
```

**Response:**
```json
{
  "status": "success",
  "breakdown_key": "550e8400-e29b-41d4-a716-446655440000_EMP001",
  "message": "Breakdown stored for candidate Alice Johnson"
}
```

---

### 7. GET /breakdown/{requirement_id}/{candidate_id}
**Retrieve detailed breakdown for a candidate**

**Path Parameters:**
- `requirement_id` (string, UUID): The unique identifier of the requirement
- `candidate_id` (string): The unique identifier of the candidate

**Response:**
```json
{
  "status": "success",
  "data": {
    "requirement_id": "550e8400-e29b-41d4-a716-446655440000",
    "candidate_id": "EMP001",
    "candidate_name": "Alice Johnson",
    "breakdown": {
      "skills_match": 95,
      "experience_match": 90,
      "certifications_match": 100,
      "availability_match": 100
    },
    "llm_summary": "...",
    "stored_at": "2026-01-28T10:40:00.000000"
  }
}
```

---

### 8. POST /search
**Semantic search for candidate matches**

**Request Body:**
```json
{
  "client_name": "Global Retail Corp",
  "role_title": "Senior Full Stack Engineer",
  "required_skills": ["React", "Node.js", "AWS", "PostgreSQL"],
  "min_experience": 5,
  "required_certs": ["AWS Solutions Architect", "Azure DP-203"],
  "availability_date": "2026-03-01",
  "requirement_summary": "Greenfield loyalty platform rebuild...",
  "top_n": 5,
  "allow_partial": true
}
```

**Response:**
```json
{
  "status": "success",
  "client_name": "Global Retail Corp",
  "role_title": "Senior Full Stack Engineer",
  "matches": [
    {
      "rank": 1,
      "name": "Alice Johnson",
      "employee_id": "EMP001",
      "role": "Senior Full Stack Engineer",
      "email": "alice.johnson@company.com",
      "bench_status": "inactive",
      "overall_fit_score": 92,
      "breakdown": {
        "skills_match": 95,
        "experience_match": 90,
        "availability_match": 100,
        "certifications_match": 100
      },
      "llm_summary": "..."
    }
  ],
  "count": 1
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid request body"
}
```

### 404 Not Found
```json
{
  "detail": "Requirement {requirement_id} not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Error message describing the issue"
}
```

---

## Data Storage

Data is stored in JSON files in the `backend/storage/` directory:

- **requirements.json**: All created client requirements
- **shortlist.json**: Candidate shortlists per requirement
- **breakdown.json**: Detailed candidate breakdowns

Example structure:
```
backend/
├── storage/
│   ├── requirements.json
│   ├── shortlist.json
│   └── breakdown.json
├── main.py
└── data_ingestion.py
```

---

## Running the Backend Server

1. Install dependencies:
```bash
pip install fastapi uvicorn pydantic
```

2. Start the server:
```bash
cd backend
uvicorn main:app --reload
```

3. Test endpoints:
```bash
python test_api.py
```

The API will be available at `http://localhost:8000`

Interactive API docs available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## Future Enhancements

- [ ] Migrate from JSON files to Azure SQL Database
- [ ] Add authentication and authorization (Azure AD / Entra ID)
- [ ] Implement data pagination for large result sets
- [ ] Add requirement status tracking (draft, submitted, matched, placed)
- [ ] Add candidate-to-requirement matching history
- [ ] Implement requirement templates for common roles
