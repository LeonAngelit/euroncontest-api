# History Log (append-only)

> Every time a session is closed, its summary is added here.
> Do not edit previous entries. Only add to the end.

---

## Session 2026-05-16 — Feature: project_architecture_analysis (id 1)

- **Status**: ✅ DONE
- **Spec**: `specs/project_architecture_analysis/` — 10 requirements (R1–R10), 9 design sections, 8 tasks
- **What was done**:
  1. `spec_author` drafted spec (requirements, design, tasks). Human approved.
  2. `implementer` wrote comprehensive 475-line `ARCHITECTURE.md` covering System Overview, Tech Stack, Component Map, Data Flow, API Endpoints, Database Schema, Environment & Deployment, Known Issues & Conventions, Quick Reference.
  3. `reviewer` first pass: CHANGES_REQUESTED (no tests for R1–R10).
  4. `implementer` added `tests/architecture.test.ts` with 10 tests covering all requirements.
  5. `reviewer` second pass: APPROVED. All 29 tests pass (19 original + 10 new).
- **Traceability**: R1–R10 each mapped to a dedicated test in `tests/architecture.test.ts`.
- **Known gap**: `src/prompts.ts` has no dedicated test (pre-existing, not part of this feature).

---

## Session 2026-05-16 — Feature: add_bcrypt_backend (id 2)

- **Status**: ✅ DONE
- **Spec**: `specs/add_bcrypt_backend/` — 8 requirements (R1–R8), 6 design sections, 12 tasks
- **What was done**:
  1. `spec_author` drafted spec. Human approved.
  2. `implementer` executed all 12 tasks (T1–T12):
     - T1: Added `hashPassword(plainPassword)` method to `UserService` class
     - T2: Updated `create()` to hash password via `this.hashPassword()` before persisting
     - T3: Updated `loginByEmail()` — removed `password.split('').reverse().join('')`, now uses plain `password`
     - T4: Updated `loginByName()` — same reversal removal
     - T5: Updated `update()` — hashes `data.password` via `this.hashPassword()` if present
     - T6: Verified `accessWithGoogle()` and `middlewares/auth.handler.js` untouched
     - T7: `./init.sh` — all tests pass, no build errors
     - T8–T12: Added `tests/users.service.test.js` with test cases covering R1–R6
  3. `reviewer` first pass: CHANGES_REQUESTED — R7 lacked concrete test.
  4. `implementer` fixed: added R7 test for `accessWithGoogle()` bcrypt password generation.
  5. `reviewer` second pass: APPROVED. All 39 tests pass (29 existing + 10 new bcrypt tests).
  6. All R1–R8 requirements mapped to concrete tests in traceability table.
- **Files changed**: `services/users.service.js` (5 targeted edits), `tests/users.service.test.js` (new, 10 test cases)
- **Files NOT changed**: `middlewares/auth.handler.js`, `accessWithGoogle()` method

---
