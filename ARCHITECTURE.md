## 🏗 Architecture Diagram

```mermaid
flowchart TD

    User[User / Browser]

    subgraph "Frontend (Vite + React)"
        UI["UI Components (Tailwind, ShadCN, Radix)"]
        Router[React Router v7]
        Forms[React Hook Form + Zod]
        Redux[Redux Toolkit Store]
        Thunks[Async Thunks]
        Axios[Axios API Client]
    end

    subgraph External
        API[Backend REST API]
    end

    User --> UI
    UI --> Router
    UI --> Forms
    UI --> Redux
    Forms --> Redux
    Redux --> Thunks
    Thunks --> Axios
    Axios --> API
    API --> Axios
    Axios --> Redux
    Redux --> UI
```

---

## 🔎 Architectural Explanation

### 1. Presentation Layer

- UI Components handle rendering and user interaction.
- Styled using TailwindCSS and component primitives.
- React Router manages navigation and route protection.

### 2. State Management Layer

- Redux Toolkit manages global state.
- Async Thunks handle asynchronous operations.
- Centralized store ensures predictable state flow.

### 3. Data Layer

- Axios handles HTTP communication.
- API integration uses token-based authentication.
- All side effects are isolated inside async thunks.

### 4. Validation Layer

- React Hook Form manages form state.
- Zod enforces schema-based validation.

---
