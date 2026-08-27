# Isolated Unit & Integration Testing System

A completely separate, isolated test suite for the Real-Time Chat Application. This testing system allows developers to run comprehensive unit, integration, and component tests before pushing code to Git.

> [!IMPORTANT]
> **Strict Immutability Rule**: No existing application code (`Chat/src/*`, `Chat-Backend/*`), pre-existing tests, or build configurations have been modified, deleted, moved, or rewritten.

---

## Directory Architecture

```text
realtime-chat-application/
├── Chat/                       # Unchanged Application Frontend
├── Chat-Backend/               # Unchanged Application Backend
└── tests/                      # Isolated Testing System
    ├── README.md               # Documentation & Guide
    ├── package.json            # Vitest + Testing Library Runner Config
    ├── run_all_tests.py        # Master Test Runner Script
    ├── frontend/
    │   ├── vitest.config.ts    # Vitest + Happy DOM Configuration
    │   ├── setup.ts            # Global DOM & Media Mocks
    │   └── unit/
    │       ├── components/     # React Component Tests (Avatar, Modal, etc.)
    │       ├── services/       # Service Tests (Auth, WebSocket)
    │       └── utils/          # Utility Tests (Storage, Date, Conversation)
    ├── backend/
    │   ├── test_settings.py    # Isolated In-Memory SQLite Test Settings
    │   ├── authentication/     # Auth Model, View, Repository Tests
    │   ├── chatting/           # Chat Model, Service, Consumer Tests
    │   ├── voice_calling/      # Voice Call State Service Tests
    │   └── video_calling/      # Video Call State Service Tests
    ├── integration/
    │   └── test_auth_chat_flow.py # End-to-End Auth & Chat Integration
    └── reports/
        └── test-summary.md     # Generated Execution Summary Report
```

---

## Prerequisites & Installation

### Frontend Test Dependencies
Navigate to the `tests/` directory and install the isolated test dependencies:
```bash
cd tests
npm install
```

### Backend Test Dependencies
The backend tests use Django's built-in test runner with Python environment:
```bash
cd Chat-Backend
.\venv\Scripts\python.exe manage.py check
```

---

## Running the Tests

### 1. Run All Tests (Backend + Frontend Master Suite)
Run the automated master test runner script from the root directory:
```bash
python tests/run_all_tests.py
```

### 2. Run Backend Tests Only
Run Django isolated tests using the dedicated in-memory SQLite settings:
```bash
cd Chat-Backend
.\venv\Scripts\python.exe manage.py test tests.backend tests.integration --settings=tests.backend.test_settings --noinput
```

### 3. Run Frontend Tests Only
Run Vitest unit and component tests:
```bash
cd tests
npm test
```

### 4. Generate Frontend Coverage Report
```bash
cd tests
npm run test:coverage
```

---

## Test Isolation & Safety Principles

1. **Database Isolation**: Backend automated tests run using an isolated in-memory SQLite database (`:memory:`) defined in `tests.backend.test_settings`. The production/development database (`db.sqlite3` or PostgreSQL) is never touched.
2. **WebSocket & Media Device Mocking**: Browser APIs (`WebSocket`, `navigator.mediaDevices.getUserMedia`) are mocked in `tests/frontend/setup.ts` to ensure tests run headlessly without real hardware or open network sockets.
3. **Immutability of Application Code**: All test logic lives strictly inside `tests/`. Application components (`Chat/src/*`) and Django backend apps (`Chat-Backend/*`) remain 100% clean and untouched.
