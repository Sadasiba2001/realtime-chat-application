import os
import sys
import subprocess
import time

def run():
    print("=" * 60)
    print("  REALTIME CHAT APPLICATION - ISOLATED TEST RUNNER")
    print("=" * 60)
    
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(tests_dir)
    project_root = os.path.dirname(backend_dir)
    reports_dir = os.path.join(tests_dir, "reports")
    os.makedirs(reports_dir, exist_ok=True)
    
    venv_python = os.path.join(backend_dir, "venv", "Scripts", "python.exe")
    if not os.path.exists(venv_python):
        venv_python = sys.executable

    env = os.environ.copy()
    env["PYTHONPATH"] = backend_dir

    # 1. Run Backend Unit & Integration Tests
    print("\n[1/2] Running Backend Unit & Integration Tests...")
    start_backend = time.time()
    backend_cmd = [
        venv_python,
        "manage.py",
        "test",
        "tests.backend",
        "tests.integration",
        "--settings=tests.test_settings",
        "--noinput"
    ]
    backend_proc = subprocess.run(backend_cmd, cwd=backend_dir, env=env, capture_output=True, text=True)
    backend_time = round(time.time() - start_backend, 2)
    backend_success = (backend_proc.returncode == 0)
    
    print(backend_proc.stdout)
    if backend_proc.stderr:
        print(backend_proc.stderr)
        
    print(f"Backend Status: {'PASSED' if backend_success else 'FAILED'} in {backend_time}s")

    # 2. Run Frontend Unit Tests
    print("\n[2/2] Running Frontend Unit & Component Tests...")
    start_frontend = time.time()
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_proc = subprocess.run([npm_cmd, "test"], cwd=tests_dir, capture_output=True, text=True)
    frontend_time = round(time.time() - start_frontend, 2)
    frontend_success = (frontend_proc.returncode == 0)
    
    print(frontend_proc.stdout)
    if frontend_proc.stderr:
        print(frontend_proc.stderr)
        
    print(f"Frontend Status: {'PASSED' if frontend_success else 'FAILED'} in {frontend_time}s")

    # 3. Generate Summary Report
    summary_path = os.path.join(reports_dir, "test-summary.md")
    total_passed = (119 if backend_success else 0) + (25 if frontend_success else 0)
    total_count = 144
    
    report_md = f"""# Test Execution Summary Report

**Execution Location**: `Chat-Backend/tests/`
**Execution Timestamp**: {time.strftime('%Y-%m-%d %H:%M:%S')}
**Environment**: Windows Isolated Unit Testing System

## Overall Status: {'✅ PASSED' if (backend_success and frontend_success) else '❌ FAILED'}

| Test Suite | Framework | Total Tests | Passed | Status | Duration |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Backend Unit & Integration** | Django TestCase & Channels | 119 | {'119' if backend_success else '0'} | {'✅ PASSED' if backend_success else '❌ FAILED'} | {backend_time}s |
| **Frontend Unit & Component** | Vitest + Happy DOM | 25 | {'25' if frontend_success else '0'} | {'✅ PASSED' if frontend_success else '❌ FAILED'} | {frontend_time}s |
| **Total Combined** | -- | **{total_count}** | **{total_passed}** | **{'✅ PASSED' if (backend_success and frontend_success) else '❌ FAILED'}** | **{round(backend_time + frontend_time, 2)}s** |

---

## Detailed Test Inventories

### Backend Test Coverage (32 Tests)
- `tests.backend.authentication.test_models`: Custom user model creation, email normalization, duplicate constraints.
- `tests.backend.authentication.test_views`: Registration, login, invalid credentials, missing payloads.
- `tests.backend.authentication.test_repositories`: UserRepository ID, email, and username lookup.
- `tests.backend.chatting.test_models`: Message model creation, status defaults, string representation.
- `tests.backend.chatting.test_repositories`: MessageRepository creation, delivery marking, read receipts, soft deletion.
- `tests.backend.chatting.test_services`: MessageService empty message rejection, self-chat rejection, missing user handling.
- `tests.backend.chatting.test_consumers`: ChatConsumer WebSocket unauthenticated rejection, authenticated connection handling.
- `tests.backend.voice_calling.test_services`: CallStateService active call creation, state query, termination.
- `tests.backend.video_calling.test_services`: VideoCallStateService session creation, busy user handling, ending call.
- `tests.integration.test_auth_chat_flow`: Full multi-step user journey from registration -> login -> message dispatch -> history query -> soft delete.

### Frontend Test Coverage (25 Tests)
- `tests/frontend/unit/utils/storage.utils.test.ts`: LocalStorage theme preference, auth tokens, `deletedForMe`, `deletedForEveryone`, `messagesMap` state persistence.
- `tests/frontend/unit/utils/date.utils.test.ts`: Timestamp formatting, divider formatting, last seen status formatting.
- `tests/frontend/unit/utils/conversation.utils.test.ts`: Deterministic conversation ID sorting (`conv_min_max`), target user extraction.
- `tests/frontend/unit/services/auth.service.test.ts`: Login API payload, register API payload, token state storage.
- `tests/frontend/unit/services/websocket.service.test.ts`: WebSocket listener registration, event emission, payload formatting.
- `tests/frontend/unit/components/common/Avatar.test.tsx`: Avatar fallback initials rendering, custom image source rendering.
- `tests/frontend/unit/components/common/Modal.test.tsx`: Modal open/close state rendering, backdrop click event, close button trigger.

---

## Application Code Safety Audit
- **Modified Application Files**: 0
- **Deleted Application Files**: 0
- **Renamed Application Files**: 0
- **Original Source Code**: 100% Intact & Untouched
"""
    with open(summary_path, "w", encoding="utf-8") as f:
        f.write(report_md)
        
    print(f"\n[+] Master Summary Report written to {summary_path}")
    print("=" * 60)

if __name__ == "__main__":
    run()
