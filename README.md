# BenchMatch AI - Employee Matching System

BenchMatch AI is an intelligent employee-to-project matching system that uses semantic search to find the best available (bench) employees for specific project requirements.

## 🏗️ Architecture Overview

### Data Pipeline: Azure SQL → Aggregation → Embedding → ChromaDB

```
Azure SQL Database (bench schema) → Data Aggregation → Nomic Embeddings → ChromaDB Vector Store → Hybrid Search
```

### Key Components

- **Data Source**: Azure SQL Database with Entra ID authentication
- **Vector Database**: ChromaDB (persistent local storage)
- **Embedding Model**: Nomic Embed v1.5 (768-dimensional vectors)
- **Search Engine**: Hybrid semantic search with business logic
- **API**: FastAPI with REST endpoints
- **Authentication**: Azure Entra ID (interactive browser login)

## 📊 Data Schema and Chunking Strategy

### Azure SQL Tables (bench schema)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `bench.employees` | Core employee info | employee_id, name, email, role, primary_skill |
| `bench.skills` | Employee skills | employee_id, skill_name, years_experience |
| `bench.certifications` | Certificates | employee_id, certificate_name, validity |
| `bench.project_history` | Past projects | employee_id, experience_summary, tools_used |
| `bench.bench_status` | Availability status | employee_id, status (active/inactive) |

### Entity-Based Chunking

**Strategy**: One Employee = One Chunk = One Embedding

Each employee's data is aggregated into a single text chunk:

```python
def build_employee_text(row):
    """Build entity-based chunk for one employee."""
    chunk = f\"\"\"Role: {row['role']}
Primary Skill: {row['primary_skill']}
Skills: {row.get('skills', '')}
Certifications: {row.get('certifications', '')}
Experience: {row.get('experience', '')}\"\"\"
    
    return chunk.strip()
```

**Example Employee Chunk**:
```
Role: Backend Developer
Primary Skill: Python
Skills: Python (5 yrs), Django (3 yrs), PostgreSQL (4 yrs), Docker (2 yrs)
Certifications: AWS Certified Developer, Python Professional Certificate
Experience: Built scalable REST APIs for e-commerce platform. Implemented microservices architecture with Docker containers.
```

### Aggregation Process

1. **Skills Grouping**: Concatenate all skills with experience years
2. **Certifications Grouping**: Join all certificate names
3. **Projects Grouping**: Combine experience summaries
4. **Data Merging**: Left join all tables on `employee_id`
5. **Text Generation**: Create semantic chunk per employee
6. **Embedding Generation**: Generate 768-dim vector using Nomic

## 🚀 Setup and Installation

### Prerequisites

1. **Python 3.8+** with pip
2. **ODBC Driver 18 for SQL Server**
3. **Azure SQL Database access** with Entra ID permissions
4. **Nomic API key** (get from [Nomic AI](https://atlas.nomic.ai/))

### Installation Steps

1. **Install ODBC Driver**:
   ```bash
   # Download from: https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server
   # Install msodbcsql.msi and restart computer
   ```

2. **Install Python dependencies**:
   ```bash
   pip install fastapi uvicorn pandas sqlalchemy pyodbc chromadb nomic
   ```

3. **Authenticate with Nomic**:
   ```bash
   nomic login
   # Follow the browser login process
   ```

## 🔧 Testing Azure Connection

### Test Script: `test_azure_connection.py`

Use the provided test script to verify Azure SQL connectivity:

```bash
cd backend
python test_azure_connection.py
```

**Expected Output**:
```
======================================================================
📡 SCANNING SCHEMA: 'bench' in db_bench
======================================================================

✅ Connection Verified.
📊 FOUND 9 TABLES IN 'bench' SCHEMA:
   ➤ bench.bench_status        |   100 rows
   ➤ bench.employees           |   100 rows
   ➤ bench.skills              |   300 rows
   ➤ bench.certifications      |   150 rows
   ➤ bench.project_history     |   200 rows
   ...

✅ Test Complete.
```

### Connection Configuration

The system uses Entra ID Interactive Authentication:

```python
AZURE_SQL_CONN_STR = (
    f"mssql+pyodbc://@ai-db-dbs.database.windows.net/db_bench"
    "?driver=ODBC+Driver+18+for+SQL+Server"
    "&authentication=ActiveDirectoryInteractive"
)
```

**Authentication Flow**:
1. Script attempts connection
2. Browser opens for Azure login
3. User logs in with credentials
4. Connection is established
5. Tables are queried and validated

## 🎯 Using main.py

### Command Line Interface

The `main.py` file provides both API and CLI interfaces:

#### 1. Data Ingestion (Load from Azure SQL → Generate Embeddings)

```bash
python main.py ingest
```

**Process**:
1. Connect to Azure SQL (Entra ID auth)
2. Load all tables from `bench` schema
3. Aggregate employee data (skills, certs, projects)
4. Generate Nomic embeddings for each employee
5. Store in ChromaDB (`chroma_data/` directory)

**Expected Output**:
```
🔹 Loading data from Azure SQL Database...
✓ Loaded 100 employees from Azure SQL
✓ Loaded 300 skill records from Azure SQL
✓ Loaded 150 certification records from Azure SQL
✓ Loaded 200 project records from Azure SQL
🔹 Aggregating employee data...
🔹 Initializing ChromaDB...
🔹 Generating embeddings for 100 employees...
  Processed 10/100 employees...
  ...
Ingestion complete: 100 succeeded, 0 failed
ChromaDB collection 'employees' has 100 embeddings
```

#### 2. Search Testing (Find Best Matches)

```bash
# Basic search with default query
python main.py search

# Custom search query
python main.py search "Backend Developer"

# Exclude partial bench candidates
python main.py search "Python developer" no-partial
```

**Search Process**:
1. Normalize query (add context for short queries)
2. Generate embedding for search query
3. Perform semantic similarity search in ChromaDB
4. Apply bench status filtering (only inactive employees)
5. Boost exact role matches (×2.0 multiplier)
6. Boost primary skill matches (×1.8 multiplier)
7. Re-rank results by combined score

**Expected Output**:
```
======================================================================
BENCH-ELIGIBLE EMPLOYEE MATCHES
======================================================================

1. Employee: EMP_001 | Role: Backend Developer
   Bench Status: inactive
   Similarity Score: 0.9234

2. Employee: EMP_045 | Role: Full Stack Developer
   Bench Status: inactive
   Similarity Score: 0.8567
   
...
======================================================================
```

### 3. API Server

```bash
# Start FastAPI server
uvicorn main:app --reload --port 8000

# Test API endpoint
curl -X POST "http://localhost:8000/search?query=Backend Developer&top_n=5"
```

**API Response**:
```json
{
  "query": "Backend Developer",
  "matches": [
    {
      "employee_id": "EMP_001",
      "role": "Backend Developer",
      "bench_status": "inactive",
      "similarity_score": 0.9234
    }
  ],
  "count": 5,
  "allow_partial": true
}
```

## 🔍 Search Algorithm Details

### Hybrid Search Strategy

The search algorithm combines semantic similarity with business logic:

1. **Query Normalization**:
   - Short queries get context: "Python" → "Python developer engineer professional"
   - Improves embedding quality for vague searches

2. **Semantic Retrieval**:
   - Generate query embedding using Nomic
   - Retrieve top candidates using cosine similarity
   - Use wider window (top_n × 6) to account for filtering

3. **Business Filtering**:
   - Only return employees with `status = "inactive"` (available on bench)
   - Filter out active, terminated, or on-leave employees

4. **Field-Level Boosting**:
   - **Exact Role Match**: ×2.0 boost (Backend Developer query → Backend Developer gets priority)
   - **Primary Skill Match**: ×1.8 boost (Python query → employees with Python as primary_skill)
   - **General Skills Match**: ×1.3-1.5 boost (skills contain query terms)

5. **Re-ranking**:
   - Combine semantic score with boost multipliers
   - Sort by final combined score
   - Return top_n results

### Search Examples

| Query | Top Result | Reason |
|-------|------------|--------|
| "Backend Developer" | Backend Developer (0.95) | Exact role match + high semantic similarity |
| "Python" | Python Developer (0.89) | Primary skill boost + context normalization |
| "React frontend" | Frontend Developer (0.87) | Role similarity + skill matching |

## 📁 Project Structure

```
BenchMatch_AI/
├── backend/
│   ├── data_ingestion.py          # Core pipeline: Azure SQL → ChromaDB
│   ├── main.py                    # FastAPI app + CLI interface
│   ├── test_azure_connection.py   # Connection testing utility
│   ├── chroma_data/              # ChromaDB persistent storage
│   │   ├── chroma.sqlite3        # Vector database file
│   │   └── ...                   # Index files
│   └── data/                     # Legacy CSV files (backup)
└── frontend/                     # React frontend (separate)
```

## 🛠️ Troubleshooting

### Common Issues

1. **"Connection is busy with results for another command"**
   - **Solution**: Restart terminal, ensure no other connections are open

2. **"ODBC Driver 18 not found"**
   - **Solution**: Install ODBC Driver 18 and restart computer

3. **"Login failed for user"**
   - **Solution**: Verify Entra ID permissions for the database

4. **"Module 'nomic' not found"**
   - **Solution**: Run `pip install nomic` and `nomic login`

5. **Empty search results**
   - **Solution**: Run `python main.py ingest` first to populate ChromaDB

### Logs and Debugging

- **Ingestion logs**: Check terminal output during `python main.py ingest`
- **Search logs**: Use `debug=True` in search functions
- **ChromaDB location**: `backend/chroma_data/`
- **Connection test**: `python test_azure_connection.py`

## 🔒 Security Notes

- **Entra ID Authentication**: No hardcoded credentials in code
- **Interactive Login**: Browser-based authentication flow
- **Local Storage**: ChromaDB and logs stored locally
- **HTTPS**: All Azure connections use encrypted transport

## 📈 Performance Characteristics

- **Ingestion**: ~100 employees in 30-60 seconds
- **Search**: <200ms per query (after embeddings are cached)
- **Storage**: ~1MB per 100 employee embeddings
- **Memory**: ~50MB for loaded ChromaDB collection

---

**Last Updated**: January 12, 2026  
**Version**: 2.0 (Azure SQL + Hybrid Search)