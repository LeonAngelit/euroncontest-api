# design.md — Project Architecture Analysis

## Feature

`project_architecture_analysis` (id 1) — Analyze the current project structure
and produce a comprehensive `ARCHITECTURE.md`.

## Files Modified

| File              | Action                                               |
| ----------------- | ---------------------------------------------------- |
| `ARCHITECTURE.md` | **Rewrite** — replace placeholder with full analysis |

No other files are modified. `src/`, `tests/`, and application code remain
untouched.

## Document Structure

The `ARCHITECTURE.md` will contain the following sections in order:

1. **System Overview** — One-paragraph description of what the project is, its
   runtime, and primary purpose. Addresses **R2**.

2. **Tech Stack** — Grouped table of `package.json` dependencies by role
   (framework, ORM/database, auth, validation, image processing, email,
   web scraping, deployment tooling). Addresses **R3**.

3. **Component Map** — Table mapping each top-level directory/file to its
   responsibility. Includes `index.js` (entry), `config/`, `db/`,
   `lib/`, `routes/`, `services/`, `schemas/`, `middlewares/` (noting the
   typo), `utils/`, `dictionaries/`, `src/` (legacy), `tests/`. Addresses
   **R4**.

4. **Data Flow** — Textual description of the request lifecycle from client
   to response, including middleware ordering, the three auth levels
   (`jwtAuth`, `jwtAuthHighLevel`, `jwtAuthAdminLevel`), validation layer,
   service layer, and error handling pipeline. A sequence-style diagram
   in plain text. Addresses **R5**.

5. **API Endpoints** — Tables per route group (users, rooms, countries,
   archive, getAuthToken, updatable, requests) showing `METHOD`, `PATH`,
   `Auth Level`, and brief description. Addresses **R6**.

6. **Database Schema** — Per-model sub-sections showing table name, columns,
   types, constraints, and associations. Cover `User`, `Country`, `Room`,
   `RoomUser`, `UserCountry`, `Updatable`. Addresses **R7**.

7. **Environment & Deployment** — How config is assembled, Docker
   (`Dockerfile`, `compose.yaml`), Vercel (`vercel.json`), and Sequelize
   migrations. Addresses **R8**.

8. **Known Issues & Conventions** — Existing patterns (Joi schemas, service
   classes, Boom errors) and known issues (`middlewares/` typo, `src/`
   legacy code). Addresses **R9**.

9. **Quick Reference** — A short section answering "where do I add X?"
   questions (new endpoint, new model, new middleware, new utility).
   Addresses **R10**.

## Approach & Alternatives

### Chosen: Single comprehensive ARCHITECTURE.md

- Keeps all project documentation in one discoverable file at the repo root.
- Aligns with the existing `ARCHITECTURE.md` placeholder and `AGENTS.md`
  reference to it.
- Easy for both humans and AI agents to locate.

### Discarded: Multiple per-module markdown files

- Would scatter documentation across many files.
- Harder to maintain consistency.
- Not referenced by `AGENTS.md`.

### Discarded: Auto-generated from source

- JSDoc / TypeDoc would not capture architectural intent, data flow, or
  conventions.
- The project is JavaScript (not TypeScript with decorators), so auto-generation
  would miss associations, auth levels, and deployment details.

## Traceability

| Requirement | Section                          |
| ----------- | -------------------------------- |
| R1          | Entire file replaces placeholder |
| R2          | System Overview                  |
| R3          | Tech Stack                       |
| R4          | Component Map                    |
| R5          | Data Flow                        |
| R6          | API Endpoints                    |
| R7          | Database Schema                  |
| R8          | Environment & Deployment         |
| R9          | Known Issues & Conventions       |
| R10         | Quick Reference                  |
