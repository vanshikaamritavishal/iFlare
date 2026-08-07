#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================
user_problem_statement: |
  Two changes requested:
  1. Restrict iFLARE to Indian university students only. A user with @sst.scaler.com should
     see ONLY flares created by other users with @sst.scaler.com. A user with @iitkgp.ac.in
     sees only IIT KGP flares. Non-university domains (gmail.com, etc.) must be rejected
     on new registration (existing users grandfathered in).
  2. The Explore button on the dashboard (bottom nav) was non-functional. Since the Flares
     page already has search + browsing, Explore was removed from all 3 nav bars.

backend:
  - task: "University domain validation on registration"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "POST /api/auth/register now calls resolveUniversity() and rejects emails whose domain is not an Indian university (explicit whitelist in /app/lib/universities.js + any .ac.in / .edu.in TLD accepted). Stores emailDomain and university fields on user."

  - task: "Flare scoping by hostEmailDomain"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "POST /api/flares now looks up the host's email domain and stores hostEmailDomain + hostUniversity on the flare. GET /api/flares accepts ?userId=... and filters query with { hostEmailDomain: <requester's domain> } so users only see flares from their campus."

  - task: "Legacy migration for emailDomain and hostEmailDomain"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "ensureMigrated() runs once per server start: backfills emailDomain on legacy users and hostEmailDomain on legacy flares by joining with users collection."

frontend:
  - task: "Explore nav button removed from all pages"
    implemented: true
    working: "NA"
    file: "app/flares/page.js, app/activity/page.js, app/profile/page.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Broken Explore nav item (no onClick) removed from all 3 bottom nav bars. Nav is now Flares / Activity / Profile."

  - task: "Register page shows college-email guidance"
    implemented: true
    working: "NA"
    file: "app/register/page.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Email field placeholder + helper text now guide users to enter an Indian college email. Backend errors are shown inline."

  - task: "Profile page shows university (read-only) instead of Community/Locality toggle"
    implemented: true
    working: "NA"
    file: "app/profile/page.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Removed obsolete Community vs Locality toggle. Added a read-only card showing the user's university (name + @domain)."

  - task: "Flares page fetch scoped by userId"
    implemented: true
    working: "NA"
    file: "app/flares/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "GET /api/flares call now includes userId param so the backend can scope by domain. Removed sample-flare merging so university filter isn't bypassed by client-side demo data."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 0
  run_ui: false

test_plan:
  current_focus:
    - "University domain validation on registration"
    - "Flare scoping by hostEmailDomain"
    - "Legacy migration for emailDomain and hostEmailDomain"
    - "Flares page fetch scoped by userId"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Please test the following backend behavior end-to-end (curl-equivalent):

      1) Registration domain gate
         a) POST /api/auth/register with email "eve@gmail.com" (or any random non-university domain) should return 400 with the university-restriction message.
         b) POST /api/auth/register with email "alice.test@sst.scaler.com" should succeed and return user.university === "Scaler School of Technology" and user.emailDomain === "sst.scaler.com".
         c) Register another Scaler user "bob.test@sst.scaler.com" - success.
         d) Register a different-university user "chandan.test@iitkgp.ac.in" - success with university reflecting IIT Kharagpur.
         e) Also verify sub-domain acceptance: any random @something.ac.in should be accepted (e.g. random@testuni.ac.in) since .ac.in is an Indian academic TLD.

      2) Flare scoping
         a) Login as alice, POST /api/flares with a flare - verify the returned flare has hostEmailDomain === "sst.scaler.com".
         b) Login as bob, GET /api/flares?interests=sports&userId=<bob's id> - alice's flare MUST appear.
         c) Login as chandan (IIT KGP), GET /api/flares?userId=<chandan's id> - alice's flare must NOT appear.
         d) Have chandan create a flare - verify alice/bob cannot see it.

      3) Legacy migration
         The DB may contain older users without emailDomain and older flares without hostEmailDomain.
         After the first API call following server restart, ensureMigrated() should backfill these.
         You can verify by querying /api/flares as a legacy user (e.g. vishaljc@gmail.com if present)
         and confirming no crashes.

      Credentials & test-plan details in /app/memory/test_credentials.md.
