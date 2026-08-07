#!/usr/bin/env python3
"""
iFLARE Backend API Tests - University Domain Visibility Feature
Tests registration domain validation, flare scoping by university, and legacy migration.
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Base URL from environment
BASE_URL = "https://iflare-preview.preview.emergentagent.com/api"

# Test results tracking
test_results = {
    "passed": 0,
    "failed": 0,
    "errors": []
}

def log_test(test_name, passed, message=""):
    """Log test result"""
    if passed:
        test_results["passed"] += 1
        print(f"✅ PASS: {test_name}")
        if message:
            print(f"   {message}")
    else:
        test_results["failed"] += 1
        test_results["errors"].append(f"{test_name}: {message}")
        print(f"❌ FAIL: {test_name}")
        print(f"   {message}")

def test_registration_domain_gate():
    """Test 1: Registration domain validation"""
    print("\n" + "="*80)
    print("TEST 1: REGISTRATION DOMAIN GATE")
    print("="*80)
    
    # Test 1a: Reject non-university domains
    print("\n--- Test 1a: Reject non-university domains ---")
    bad_domains = [
        "eve@gmail.com",
        "eve@yahoo.com", 
        "eve@hotmail.com",
        "eve@random.com"
    ]
    
    for email in bad_domains:
        try:
            response = requests.post(
                f"{BASE_URL}/auth/register",
                json={
                    "name": "Eve Test",
                    "email": email,
                    "password": "password123",
                    "interests": ["sports", "music", "food"]
                },
                timeout=10
            )
            
            if response.status_code == 400:
                error_msg = response.json().get("error", "")
                if "Indian" in error_msg or "university" in error_msg or "college" in error_msg:
                    log_test(f"Reject {email}", True, f"Correctly rejected with: {error_msg}")
                else:
                    log_test(f"Reject {email}", False, f"Wrong error message: {error_msg}")
            else:
                log_test(f"Reject {email}", False, f"Expected 400, got {response.status_code}: {response.text}")
        except Exception as e:
            log_test(f"Reject {email}", False, f"Exception: {str(e)}")
    
    # Test 1b: Accept explicit whitelist - Scaler user A
    print("\n--- Test 1b: Accept explicit whitelist (alice@sst.scaler.com) ---")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "name": "Alice Scaler",
                "email": "alice.test@sst.scaler.com",
                "password": "password123",
                "interests": ["sports", "music", "food"]
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            user = data.get("user", {})
            
            # Check university field
            if user.get("university") == "Scaler School of Technology":
                log_test("Alice registration - university field", True, f"university = {user.get('university')}")
            else:
                log_test("Alice registration - university field", False, f"Expected 'Scaler School of Technology', got {user.get('university')}")
            
            # Check emailDomain field
            if user.get("emailDomain") == "sst.scaler.com":
                log_test("Alice registration - emailDomain field", True, f"emailDomain = {user.get('emailDomain')}")
            else:
                log_test("Alice registration - emailDomain field", False, f"Expected 'sst.scaler.com', got {user.get('emailDomain')}")
            
            # Store alice's credentials
            global alice_id, alice_token
            alice_id = user.get("id")
            alice_token = data.get("token")
            print(f"   Alice ID: {alice_id}")
        else:
            log_test("Alice registration", False, f"Expected 200, got {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Alice registration", False, f"Exception: {str(e)}")
    
    # Test 1c: Accept explicit whitelist - Scaler user B
    print("\n--- Test 1c: Accept explicit whitelist (bob@sst.scaler.com) ---")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "name": "Bob Scaler",
                "email": "bob.test@sst.scaler.com",
                "password": "password123",
                "interests": ["sports", "tech", "learning"]
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            user = data.get("user", {})
            
            if user.get("university") == "Scaler School of Technology" and user.get("emailDomain") == "sst.scaler.com":
                log_test("Bob registration", True, f"university = {user.get('university')}, emailDomain = {user.get('emailDomain')}")
            else:
                log_test("Bob registration", False, f"Wrong fields: university={user.get('university')}, emailDomain={user.get('emailDomain')}")
            
            # Store bob's credentials
            global bob_id, bob_token
            bob_id = user.get("id")
            bob_token = data.get("token")
            print(f"   Bob ID: {bob_id}")
        else:
            log_test("Bob registration", False, f"Expected 200, got {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Bob registration", False, f"Exception: {str(e)}")
    
    # Test 1d: Accept different university - IIT KGP
    print("\n--- Test 1d: Accept different university (chandan@iitkgp.ac.in) ---")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "name": "Chandan KGP",
                "email": "chandan.test@iitkgp.ac.in",
                "password": "password123",
                "interests": ["sports", "music", "tech"]
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            user = data.get("user", {})
            
            if user.get("university") == "IIT Kharagpur" and user.get("emailDomain") == "iitkgp.ac.in":
                log_test("Chandan registration", True, f"university = {user.get('university')}, emailDomain = {user.get('emailDomain')}")
            else:
                log_test("Chandan registration", False, f"Wrong fields: university={user.get('university')}, emailDomain={user.get('emailDomain')}")
            
            # Store chandan's credentials
            global chandan_id, chandan_token
            chandan_id = user.get("id")
            chandan_token = data.get("token")
            print(f"   Chandan ID: {chandan_id}")
        else:
            log_test("Chandan registration", False, f"Expected 200, got {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Chandan registration", False, f"Exception: {str(e)}")
    
    # Test 1e: Accept .ac.in TLD
    print("\n--- Test 1e: Accept .ac.in TLD (demo@newcampus.ac.in) ---")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "name": "Demo User",
                "email": "demo@newcampus.ac.in",
                "password": "password123",
                "interests": ["sports", "music", "food"]
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            user = data.get("user", {})
            log_test("Accept .ac.in TLD", True, f"university = {user.get('university')}, emailDomain = {user.get('emailDomain')}")
        else:
            log_test("Accept .ac.in TLD", False, f"Expected 200, got {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Accept .ac.in TLD", False, f"Exception: {str(e)}")
    
    # Test 1f: Accept .edu.in TLD
    print("\n--- Test 1f: Accept .edu.in TLD (demo@somecollege.edu.in) ---")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "name": "Demo User 2",
                "email": "demo@somecollege.edu.in",
                "password": "password123",
                "interests": ["sports", "music", "food"]
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            user = data.get("user", {})
            log_test("Accept .edu.in TLD", True, f"university = {user.get('university')}, emailDomain = {user.get('emailDomain')}")
        else:
            log_test("Accept .edu.in TLD", False, f"Expected 200, got {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Accept .edu.in TLD", False, f"Exception: {str(e)}")

def test_flare_scoping():
    """Test 2: Flare scoping by hostEmailDomain"""
    print("\n" + "="*80)
    print("TEST 2: FLARE SCOPING BY HOSTEMAILDOMAI")
    print("="*80)
    
    # Test 2a: Create flare as alice
    print("\n--- Test 2a: Create flare as alice (sst.scaler.com) ---")
    start_time = (datetime.now() + timedelta(hours=2)).isoformat()
    
    try:
        response = requests.post(
            f"{BASE_URL}/flares",
            json={
                "title": "Alice's Sports Meetup",
                "description": "Let's play basketball at the campus court",
                "interests": ["sports"],
                "location": "Campus Basketball Court",
                "startTime": start_time,
                "maxAttendees": 10,
                "hostId": alice_id,
                "hostName": "Alice Scaler"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            flare = response.json()
            
            # Check hostEmailDomain
            if flare.get("hostEmailDomain") == "sst.scaler.com":
                log_test("Alice flare - hostEmailDomain", True, f"hostEmailDomain = {flare.get('hostEmailDomain')}")
            else:
                log_test("Alice flare - hostEmailDomain", False, f"Expected 'sst.scaler.com', got {flare.get('hostEmailDomain')}")
            
            # Check hostUniversity
            if flare.get("hostUniversity"):
                log_test("Alice flare - hostUniversity", True, f"hostUniversity = {flare.get('hostUniversity')}")
            else:
                log_test("Alice flare - hostUniversity", False, "hostUniversity not set")
            
            # Store alice's flare ID
            global alice_flare_id
            alice_flare_id = flare.get("id")
            print(f"   Alice Flare ID: {alice_flare_id}")
        else:
            log_test("Alice create flare", False, f"Expected 200, got {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Alice create flare", False, f"Exception: {str(e)}")
    
    # Test 2b: Bob (same university) should see alice's flare
    print("\n--- Test 2b: Bob (same university) should see alice's flare ---")
    try:
        response = requests.get(
            f"{BASE_URL}/flares?interests=sports&userId={bob_id}",
            timeout=10
        )
        
        if response.status_code == 200:
            flares = response.json()
            alice_flare_found = any(f.get("id") == alice_flare_id for f in flares)
            
            if alice_flare_found:
                log_test("Bob sees Alice's flare", True, f"Found alice's flare in {len(flares)} flares")
            else:
                log_test("Bob sees Alice's flare", False, f"Alice's flare not found. Got {len(flares)} flares: {[f.get('id') for f in flares]}")
        else:
            log_test("Bob sees Alice's flare", False, f"Expected 200, got {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Bob sees Alice's flare", False, f"Exception: {str(e)}")
    
    # Test 2c: Chandan (different university) should NOT see alice's flare
    print("\n--- Test 2c: Chandan (different university) should NOT see alice's flare ---")
    try:
        response = requests.get(
            f"{BASE_URL}/flares?userId={chandan_id}",
            timeout=10
        )
        
        if response.status_code == 200:
            flares = response.json()
            alice_flare_found = any(f.get("id") == alice_flare_id for f in flares)
            
            if not alice_flare_found:
                log_test("Chandan does NOT see Alice's flare", True, f"Correctly filtered out. Got {len(flares)} flares")
            else:
                log_test("Chandan does NOT see Alice's flare", False, f"Alice's flare should not be visible to Chandan")
        else:
            log_test("Chandan does NOT see Alice's flare", False, f"Expected 200, got {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Chandan does NOT see Alice's flare", False, f"Exception: {str(e)}")
    
    # Test 2d: Create flare as chandan
    print("\n--- Test 2d: Create flare as chandan (iitkgp.ac.in) ---")
    start_time = (datetime.now() + timedelta(hours=3)).isoformat()
    
    try:
        response = requests.post(
            f"{BASE_URL}/flares",
            json={
                "title": "Chandan's Tech Talk",
                "description": "Discussion on AI and ML",
                "interests": ["tech"],
                "location": "IIT KGP Library",
                "startTime": start_time,
                "maxAttendees": 15,
                "hostId": chandan_id,
                "hostName": "Chandan KGP"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            flare = response.json()
            
            if flare.get("hostEmailDomain") == "iitkgp.ac.in":
                log_test("Chandan create flare", True, f"hostEmailDomain = {flare.get('hostEmailDomain')}")
            else:
                log_test("Chandan create flare", False, f"Expected 'iitkgp.ac.in', got {flare.get('hostEmailDomain')}")
            
            # Store chandan's flare ID
            global chandan_flare_id
            chandan_flare_id = flare.get("id")
            print(f"   Chandan Flare ID: {chandan_flare_id}")
        else:
            log_test("Chandan create flare", False, f"Expected 200, got {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Chandan create flare", False, f"Exception: {str(e)}")
    
    # Test 2e: Alice should NOT see chandan's flare
    print("\n--- Test 2e: Alice should NOT see chandan's flare ---")
    try:
        response = requests.get(
            f"{BASE_URL}/flares?userId={alice_id}",
            timeout=10
        )
        
        if response.status_code == 200:
            flares = response.json()
            chandan_flare_found = any(f.get("id") == chandan_flare_id for f in flares)
            
            if not chandan_flare_found:
                log_test("Alice does NOT see Chandan's flare", True, f"Correctly filtered out. Got {len(flares)} flares")
            else:
                log_test("Alice does NOT see Chandan's flare", False, f"Chandan's flare should not be visible to Alice")
        else:
            log_test("Alice does NOT see Chandan's flare", False, f"Expected 200, got {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Alice does NOT see Chandan's flare", False, f"Exception: {str(e)}")
    
    # Test 2f: Bob should NOT see chandan's flare
    print("\n--- Test 2f: Bob should NOT see chandan's flare ---")
    try:
        response = requests.get(
            f"{BASE_URL}/flares?userId={bob_id}",
            timeout=10
        )
        
        if response.status_code == 200:
            flares = response.json()
            chandan_flare_found = any(f.get("id") == chandan_flare_id for f in flares)
            
            if not chandan_flare_found:
                log_test("Bob does NOT see Chandan's flare", True, f"Correctly filtered out. Got {len(flares)} flares")
            else:
                log_test("Bob does NOT see Chandan's flare", False, f"Chandan's flare should not be visible to Bob")
        else:
            log_test("Bob does NOT see Chandan's flare", False, f"Expected 200, got {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Bob does NOT see Chandan's flare", False, f"Exception: {str(e)}")
    
    # Test 2g: Backward compatibility - no userId param should return unscoped results
    print("\n--- Test 2g: Backward compatibility - no userId param (unscoped) ---")
    try:
        response = requests.get(
            f"{BASE_URL}/flares",
            timeout=10
        )
        
        if response.status_code == 200:
            flares = response.json()
            # Should return all flares (both alice's and chandan's)
            alice_found = any(f.get("id") == alice_flare_id for f in flares)
            chandan_found = any(f.get("id") == chandan_flare_id for f in flares)
            
            if alice_found and chandan_found:
                log_test("Backward compatibility - unscoped query", True, f"Both flares visible without userId. Got {len(flares)} flares")
            else:
                log_test("Backward compatibility - unscoped query", False, f"Expected both flares. Alice found: {alice_found}, Chandan found: {chandan_found}")
        else:
            log_test("Backward compatibility - unscoped query", False, f"Expected 200, got {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Backward compatibility - unscoped query", False, f"Exception: {str(e)}")

def test_login_response():
    """Test 3: Login response includes university and emailDomain"""
    print("\n" + "="*80)
    print("TEST 3: LOGIN RESPONSE FIELDS")
    print("="*80)
    
    print("\n--- Test 3a: Login as alice ---")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={
                "email": "alice.test@sst.scaler.com",
                "password": "password123"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            user = data.get("user", {})
            
            # Check university field
            if user.get("university") == "Scaler School of Technology":
                log_test("Login - university field", True, f"university = {user.get('university')}")
            else:
                log_test("Login - university field", False, f"Expected 'Scaler School of Technology', got {user.get('university')}")
            
            # Check emailDomain field
            if user.get("emailDomain") == "sst.scaler.com":
                log_test("Login - emailDomain field", True, f"emailDomain = {user.get('emailDomain')}")
            else:
                log_test("Login - emailDomain field", False, f"Expected 'sst.scaler.com', got {user.get('emailDomain')}")
        else:
            log_test("Login response", False, f"Expected 200, got {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Login response", False, f"Exception: {str(e)}")

def test_legacy_migration():
    """Test 4: Legacy migration - verify no crashes"""
    print("\n" + "="*80)
    print("TEST 4: LEGACY MIGRATION")
    print("="*80)
    
    print("\n--- Test 4a: Verify API calls work after migration ---")
    try:
        # Just call the flares endpoint to trigger migration
        response = requests.get(
            f"{BASE_URL}/flares",
            timeout=10
        )
        
        if response.status_code == 200:
            log_test("Legacy migration - no crashes", True, "API calls work correctly after migration")
        else:
            log_test("Legacy migration - no crashes", False, f"Expected 200, got {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Legacy migration - no crashes", False, f"Exception: {str(e)}")

def print_summary():
    """Print test summary"""
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Total Passed: {test_results['passed']}")
    print(f"Total Failed: {test_results['failed']}")
    
    if test_results['failed'] > 0:
        print("\n❌ FAILED TESTS:")
        for error in test_results['errors']:
            print(f"  - {error}")
        return 1
    else:
        print("\n✅ ALL TESTS PASSED!")
        return 0

if __name__ == "__main__":
    print("="*80)
    print("iFLARE BACKEND API TESTS - UNIVERSITY DOMAIN VISIBILITY")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    
    # Initialize global variables
    alice_id = None
    alice_token = None
    alice_flare_id = None
    bob_id = None
    bob_token = None
    chandan_id = None
    chandan_token = None
    chandan_flare_id = None
    
    try:
        # Run all tests
        test_registration_domain_gate()
        test_flare_scoping()
        test_login_response()
        test_legacy_migration()
        
        # Print summary and exit
        exit_code = print_summary()
        sys.exit(exit_code)
        
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
