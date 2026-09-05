# Isolated Unit & Integration Testing System

A completely separate, isolated test suite for the Real-Time Chat Application located inside the `Chat-Backend/tests/` directory.

> [!IMPORTANT]
> **Strict Immutability Rule**: No existing application code (`Chat/src/*`, `Chat-Backend/chatting_service/*`, etc.), pre-existing tests, or build configurations have been modified, deleted, moved, or rewritten.

---

## Directory Architecture

```text
Chat-Backend/tests/
├── README.md               # Documentation & Usage Guide
├── package.json            # Vitest + React Testing Library Runner Config
├── test_settings.py        # Isolated In-Memory SQLite Settings
├── run_all_tests.py        # Master Test Runner Script
├── frontend/
│   ├── vitest.config.ts    # Vitest Configuration
│   ├── setup.ts            # Global DOM & Media Mocks
│   └── unit/
│       ├── components/     # React Component Tests (Avatar, Modal)
│       ├── services/       # Service Tests (Auth, WebSocket)
│       └── utils/          # Utility Tests (Storage, Date, Conversation)
├── backend/
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
Navigate to `Chat-Backend/tests/` and install the isolated test dependencies:
```bash
cd Chat-Backend/tests
npm install
```

---

## Running the Tests

### 1. Run ALL Tests (Backend + Frontend Master Suite)
From `Chat-Backend/`:
```bash
cd Chat-Backend
.\venv\Scripts\python.exe tests/run_all_tests.py
```

### 2. Run Backend Unit Tests Only
From `Chat-Backend/`:
```bash
cd Chat-Backend
.\venv\Scripts\python.exe manage.py test tests.backend tests.integration --settings=tests.test_settings --noinput
```

### 3. Run Frontend Unit Tests Only
From `Chat-Backend/tests/`:
```bash
cd Chat-Backend/tests
npm test
```
