"""
Simple test script for the new API endpoints.
Run this to verify POST and GET endpoints are working.

Usage:
    python test_api.py
"""

import requests
import json

BASE_URL = "http://localhost:8001"

def test_create_requirement():
    """Test POST /requirements"""
    print("\n" + "="*60)
    print("TEST 1: POST /requirements (Create Requirement)")
    print("="*60)
    
    payload = {
        "client_name": "TechVision Solutions",
        "role_title": "Senior Cloud Architect",
        "required_skills": ["Python", "AWS", "Kubernetes", "Terraform"],
        "minimum_experience": 7,
        "mandatory_certifications": ["AWS Certified Solutions Architect", "Certified Kubernetes Administrator"],
        "availability_date": "2026-03-15",
        "requirement_summary": "Building enterprise-grade cloud infrastructure. Need architect with 7+ years AWS experience and Kubernetes expertise for 12-month engagement."
    }
    
    try:
        response = requests.post(f"{BASE_URL}/requirements", json=payload)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response:\n{json.dumps(data, indent=2)}")
        
        if response.status_code == 200:
            requirement_id = data.get("requirement_id")
            print(f"\n✓ Requirement created with ID: {requirement_id}")
            return requirement_id
    except Exception as e:
        print(f"✗ Error: {e}")
        return None


def test_get_requirements():
    """Test GET /requirements"""
    print("\n" + "="*60)
    print("TEST 2: GET /requirements (Get All Requirements)")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/requirements")
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response:\n{json.dumps(data, indent=2)}")
        print(f"✓ Retrieved {data.get('count', 0)} requirements")
    except Exception as e:
        print(f"✗ Error: {e}")


def test_get_requirement_by_id(requirement_id: str):
    """Test GET /requirements/{requirement_id}"""
    print("\n" + "="*60)
    print(f"TEST 3: GET /requirements/{requirement_id}")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/requirements/{requirement_id}")
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response:\n{json.dumps(data, indent=2)}")
        print(f"✓ Retrieved requirement details")
    except Exception as e:
        print(f"✗ Error: {e}")


def test_store_shortlist(requirement_id: str):
    """Test POST /search - Run semantic search and store shortlist"""
    print("\n" + "="*60)
    print("TEST 4: POST /search (Semantic Search & Store Shortlist)")
    print("="*60)
    
    # This payload matches the SearchRequest model in main.py
    payload = {
        "requirement_id": requirement_id,
        "client_name": "TechVision Solutions",
        "role_title": "Senior Cloud Architect",
        "required_skills": ["Python", "AWS", "Kubernetes", "Terraform"],
        "min_experience": 7,
        "required_certs": ["AWS Certified Solutions Architect", "Certified Kubernetes Administrator"],
        "availability_date": "2026-03-15",
        "requirement_summary": "Building enterprise-grade cloud infrastructure. Need architect with 7+ years AWS experience and Kubernetes expertise for 12-month engagement.",
        "top_n": 5,
        "allow_partial": True
    }
    
    try:
        response = requests.post(f"{BASE_URL}/search", json=payload)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response:\n{json.dumps(data, indent=2)}")
        if response.status_code == 200:
            match_count = data.get("count", 0)
            print(f"✓ Search completed - Found {match_count} candidates")
        else:
            print(f"✗ Search failed")
    except Exception as e:
        print(f"✗ Error: {e}")


def test_get_shortlist(requirement_id: str):
    """Test GET /shortlist/{requirement_id}"""
    print("\n" + "="*60)
    print(f"TEST 5: GET /shortlist/{requirement_id}")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/shortlist/{requirement_id}")
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response:\n{json.dumps(data, indent=2)}")
        if response.status_code == 200:
            candidate_count = data.get('data', {}).get('candidate_count', 0)
            print(f"✓ Retrieved shortlist with {candidate_count} candidates")
            # Return first employee_id for breakdown test
            candidates = data.get('data', {}).get('candidates', [])
            if candidates:
                return candidates[0].get('employee_id')
        else:
            print(f"✗ Shortlist not found (search may not have been run)")
    except Exception as e:
        print(f"✗ Error: {e}")
    return None


def test_get_breakdown(requirement_id: str, employee_id: str = None):
    """Test GET /breakdown/{requirement_id}/{employee_id}"""
    emp_id = employee_id or "ID_0048"
    print("\n" + "="*60)
    print(f"TEST 6: GET /breakdown/{requirement_id}/{emp_id}")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/breakdown/{requirement_id}/{emp_id}")
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response:\n{json.dumps(data, indent=2)}")
        if response.status_code == 200:
            print(f"✓ Retrieved breakdown details for {emp_id}")
        else:
            print(f"✗ Breakdown not found (run search first)")
    except Exception as e:
        print(f"✗ Error: {e}")


if __name__ == "__main__":
    print("\n" + "="*60)
    print("API ENDPOINT TEST SUITE")
    print("="*60)
    print("\n⚠️  Make sure the FastAPI server is running:")
    print("   uvicorn main:app --host 127.0.0.1 --port 8001")
    print("\nThis will test all POST and GET endpoints...\n")
    
    # Test flow
    req_id = test_create_requirement()
    
    if req_id:
        test_get_requirements()
        test_get_requirement_by_id(req_id)
        test_store_shortlist(req_id)  # POST /search - runs semantic search
        emp_id = test_get_shortlist(req_id)  # GET /shortlist - returns first employee_id
        test_get_breakdown(req_id, emp_id)  # GET /breakdown
        
        print("\n" + "="*60)
        print("✓ ALL TESTS COMPLETED")
        print("="*60)
        print("\nJSON files created in ./storage/ directory:")
        print("  - storage/requirements.json")
        print("  - storage/shortlist.json")
        print("  - storage/breakdown.json")
    else:
        print("\n✗ Failed to create requirement. Make sure server is running.")
