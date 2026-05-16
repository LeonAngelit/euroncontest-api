# Implementation Report — add_bcrypt_for_room_service

**Feature ID:** 3  
**Status:** done  
**Date:** 2026-05-16

## Tasks Completed

| Task | Description | Status |
|------|-------------|--------|
| T1 | Added `hashPassword(plainPassword)` method to `RoomService` class | ✅ |
| T2 | `RoomService.create()` now hashes password before `models.Room.create(data)` | ✅ |
| T3 | `RoomService.update()` conditionally hashes password when present | ✅ |
| T4 | `RoomService.loginByRoomName()` uses `bcrypt.compareSync \|\| ===` for backward compat | ✅ |
| T5 | `RoomService.loginById()` (renamed from `loginByRoomId`) removes password reversal, uses `bcrypt.compareSync \|\| ===` | ✅ |
| T6 | Created `tests/rooms.service.test.js` with 10 test cases | ✅ |
| T7 | Updated `ARCHITECTURE.md` — rooms table, component map, auth levels, known issues | ✅ |
| T8 | `./init.sh` passes — all 49 tests green, no build errors | ✅ |

## Files Modified

| File | Change |
|------|--------|
| `services/rooms.service.js` | Added `hashPassword()`, hash in `create()`/`update()`, backward-compat in `loginByRoomName()`/`loginById()`, renamed `loginByRoomId` → `loginById` |
| `tests/rooms.service.test.js` | New file — 10 unit tests covering create, login (both methods), update, backward compat |
| `ARCHITECTURE.md` | Updated rooms table, component map, auth levels; added Known Issue #8 about backward compat |
| `specs/add_bcrypt_for_room_service/tasks.md` | All tasks marked `[x]` |

## Requirement Traceability

| Requirement | Test(s) |
|------------|---------|
| R1 — `create()` hashes password with bcrypt before storage | `create() — should hash the password with bcrypt before storing the room (R1)` |
| R2 — `update()` hashes new password; leaves existing hash unchanged when absent | `update() — should hash password when provided and does not modify other fields (R2)` |
| R3 — `loginByRoomName()` compares plain-text against stored hash | `loginByRoomName() — should authenticate with correct plain-text password against stored hash (R3)`; `should reject an incorrect password (R3)` |
| R4 — `loginById()` compares plain-text against stored hash, no reversal | `loginById() — should authenticate with correct plain-text password against stored hash (no reversal, R4)`; `should reject an incorrect password (R4)` |
| R5 — `RoomService.hashPassword()` returns `bcrypt.hashSync(plain, genSaltSync(12))` | `create() — should produce a hash verifiable with bcrypt.compareSync (R5)` |
| R6 — Backward-compatible plain-text login | `loginByRoomName() — should authenticate with correct plain-text password against stored plain text (backward compat, R6)`; `loginById() — should authenticate with correct plain-text password against stored plain text (backward compat, R6)` |
| R7 — Tests cover all password handling scenarios | 10 test cases covering create, login (both methods), update, and backward compat |
| R8 — `ARCHITECTURE.md` documents bcrypt room password hashing | Updated: rooms table, component map, auth levels, Known Issue #8 |
| R9 — `update()` does not hash when password absent | `update() — should not hash when password field is absent from update payload (R9)` |
| R10 — No build or lint errors | `./init.sh` passes with all 49 tests green |