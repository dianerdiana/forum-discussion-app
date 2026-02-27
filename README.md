# Forum Discussion App

A modern web-based forum discussion application built with React, TypeScript, Redux Toolkit, and Vite.
This project implements authentication, thread management, discussion features, testing, and UI component development using Storybook.

---

## 🚀 Tech Stack

### Core

- **React 19**
- **TypeScript**
- **Vite**
- **Redux Toolkit**
- **React Router v7**
- **Axios**

### UI & Styling

- **TailwindCSS v4**
- **Radix UI**
- **ShadCN**
- **Lucide React**
- **Sonner (Toast Notification)**

### Forms & Validation

- **React Hook Form**
- **Zod**

### Testing

- **Vitest**
- **Testing Library**
- **Cypress (E2E)**

### Code Quality

- **ESLint**
- **Prettier**
- **TypeScript Strict Mode**

### Component Development

- **Storybook**

---

## 📦 Installation

Clone the repository:

```bash
git clone https://github.com/dianerdiana/forum-discussion-app.git
cd forum-discussion-app
```

Install dependencies:

```bash
npm install
```

---

## 🧪 Available Scripts

### Development

```bash
npm run dev
```

Starts Vite development server.

---

### Build Production

```bash
npm run build
```

Builds the app for production.

---

### Preview Production Build

```bash
npm run preview
```

---

### Linting

```bash
npm run lint
npm run lint:fix
```

---

### Formatting

```bash
npm run format
```

---

### Unit & Integration Testing

```bash
npm run test
```

Runs tests using Vitest.

---

### End-to-End Testing (Cypress)

```bash
npm run e2e
```

---

### CI Test (Unit + E2E)

```bash
npm run ci:test
```

Runs unit tests, starts dev server, then executes Cypress tests.

---

### Storybook

Run Storybook:

```bash
npm run storybook
```

Build Storybook:

```bash
npm run build-storybook
```

---

## 🧠 Architecture Overview

This project follows a modular feature-based structure:

```
src/
 ├── app/
 ├── components/
 ├── features/
 │    ├── auth/
 │    ├── threads/
 │    ├── users/
 │    └── ...
 ├── redux/
 ├── routes/
 └── utils/
```

### Architectural Principles

- Feature-based modularization
- Global state management via Redux Toolkit
- Separation between UI components and business logic
- Form validation using schema-based validation (Zod)
- Test-driven component reliability
- Storybook-driven UI development

---

## 🔐 Authentication Flow

- Login & Register
- Auth state managed globally
- Protected routes
- Token-based API communication using Axios

---

## 🧪 Testing Strategy

| Layer            | Tool            |
| ---------------- | --------------- |
| Unit Test        | Vitest          |
| Component Test   | Testing Library |
| E2E Test         | Cypress         |
| UI Isolated Test | Storybook       |

Testing ensures:

- Reducer correctness
- Async thunk behavior
- Component rendering
- User interaction simulation
- Full user flow validation

---

## 📁 Environment Variables

If using external API:

Create `.env` file:

```
VITE_BASE_URL=your_api_url_here
```

---

## 📌 Key Features

- User Authentication
- Thread Creation
- Thread Detail View
- Commenting System
- Redux Async Thunk Integration
- Loading & Error Handling
- Toast Notifications
- Dark/Light Theme Support
- Fully Tested Codebase
- Component Documentation via Storybook

---

## 🛠 Development Notes

- Strict ESLint configuration using `eslint-config-dicodingacademy`
- Import sorting via Prettier plugin
- Uses `start-server-and-test` for CI workflow
- Built with scalable and maintainable folder structure

---

## 📜 License

This project is for learning and portfolio purposes.

---
