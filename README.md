# BenchMatch AI

End-to-end app for creating client requirements, matching bench employees, and viewing shortlists.

## Project Structure

- `backend/` - FastAPI service, Azure SQL integration, embedding ingestion/search
- `frontend/` - React + TypeScript + Vite UI

## Prerequisites

Install these before setup:

1. **Python**: 3.10+ (recommended)
2. **Node.js**: 18+ (LTS recommended)
3. **ODBC Driver 18 for SQL Server** (required for Azure SQL via `pyodbc`)
4. **Azure access** to `db_bench` (Entra ID / Active Directory Integrated auth)
5. **Nomic API key** (required for embedding/ingestion and semantic search)

---

## Setup From Scratch

Run all commands from the repository root.

### 1) Clone and enter project

```powershell
git clone <your-repo-url>
cd BenchMatch_AI
```

### 2) Backend setup (Python)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
```

Create `.env` file in `backend/`:

```env
NOMIC_API_KEY=your_nomic_api_key_here
AZURE_SQL_SCHEMA=bench
# Optional: set if your network uses corporate/self-signed TLS certificates
# Example: C:\\certs\\corp-root-ca.pem
NOMIC_CA_BUNDLE=
```

Notes:
- `AZURE_SQL_SCHEMA` defaults to `bench` if not set.
- Backend uses Active Directory Integrated auth for Azure SQL.

### 3) Frontend setup (Node)

```powershell
cd frontend
npm install
cd ..
```

---

## How to Start the Application

You need **2 terminals**.

### Terminal 1 - Start Backend API

```powershell
cd backend
..\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend health check:
- Open: `http://localhost:8000/`
- Expected: `{"status":"ok","message":"BenchMatch AI API is running"}`

### Terminal 2 - Start Frontend

```powershell
cd frontend
npm run dev
```

Frontend URL:
- `http://localhost:5173`

---

## First-Time Data Ingestion (Required for Search Quality)

Run once (or whenever source data changes):

```powershell
cd backend
..\.venv\Scripts\Activate.ps1
python -c "from data_ingestion import ingest; ingest()"
```

This loads employee data from Azure SQL, creates embeddings, and stores vectors in `backend/chroma_data/`.

---

## Useful Development Commands

### Backend

```powershell
cd backend
..\.venv\Scripts\Activate.ps1
python test_azure_connection.py
python test_api.py
```

### Frontend

```powershell
cd frontend
npm run lint
npm run build
npm run preview
```

---

## Common Issues

- **`pyodbc` / SQL driver errors**: Ensure ODBC Driver 18 is installed.
- **Auth/login failures to Azure SQL**: Verify your Entra ID account has DB access.
- **Embedding/search errors**: Check `NOMIC_API_KEY` in `backend/.env`.
- **`CERTIFICATE_VERIFY_FAILED` to `api-atlas.nomic.ai`**:
	- Export your corporate root/intermediate CA cert as `.pem`
	- Set `NOMIC_CA_BUNDLE` in `backend/.env` to that file path
	- Restart backend and run ingestion again
- **CORS/connection issues in UI**: Make sure backend is running on `http://localhost:8000`.

---

## API Reference

For endpoint details and request/response samples, see:
- `backend/API_DOCUMENTATION.md`
