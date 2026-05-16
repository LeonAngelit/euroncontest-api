# Design — change_auth_p_variable_to_already_hashed

## 1. Overview

Change `AUTH_P` from a plain-text secret to a pre-hashed bcrypt value. The
frontend now sends the plain-text password, and the backend always compares
using `bcrypt.compareSync(plaintext, hashedEnvValue)`. JWT tokens carry the
hashed value in the `auth` claim; verification compares `decoded.auth ===
config.authp` (both are the same hash).

## 2. Files Modified

| File                        | Change                                                                       |
| --------------------------- | ---------------------------------------------------------------------------- |
| `config/config.js`         | Add startup validation that `AUTH_P` is a valid bcrypt hash                  |
| `middlewares/auth.handler.js` | In `headerAuth`: change `bcrypt.compareSync(config.authp, data)` to `bcrypt.compareSync(data, config.authp)`; in `jwtAuth`, `jwtAuthAdminLevel`, `jwtAuthHighLevel`: `decoded.auth` comparison stays as string equality (both are the hash now) |
| `routes/getAuthToken.js`    | No logic change needed — `config.authp` is already used directly in JWT sign. Behaviour changes because `config.authp` is now hashed. |
| `services/users.service.js` | No logic change needed — `config.authp` in JWT sign and password hash composition work with the hashed value. |
| `services/rooms.service.js` | No logic change for `authp` in JWT sign/comparison — same as above. |
| `services/updatable.service.js` | No logic change — `master_password: config.authp` now stores the hash. |
| `tests/users.service.test.js` | Update `config.authp` test values to use bcrypt-hashed strings. |
| `.env`                        | The implementer reads the current plain-text `AUTH_P`, hashes it with `bcrypt.hashSync(value, 12)`, and writes the hash back. If already a bcrypt hash, skip. |
| `ARCHITECTURE.md`           | Update AUTH_P description and `headerAuth` description to reflect hashed value. |
| `.env.example` (if exists)  | Add comment that `AUTH_P` must be a bcrypt hash.                             |

## 3. Key Technical Decisions

### 3.1 Startup Validation

A new function `validateAuthP()` in `config/config.js` will check that
`process.env.AUTH_P` matches the bcrypt hash regex `/^\$2[aby]\$\d{2}\$.+/`.
If invalid, `console.error()` and `process.exit(1)`.

**Alternative considered**: Validate lazily on first use. **Rejected** because
a misconfigured AUTH_P would cause silent auth failures and is hard to
debug. Early fail is safer.

### 3.2 headerAuth Middleware — Argument Order Fix

Current code: `bcrypt.compareSync(config.authp, data)` where `config.authp` is
plain-text and `data` is the client-sent Authorization header value. This
happens to work with bcrypt because `compareSync(plaintext, hash)` works if
the arguments are swapped and both are strings, but only because the current
`config.authp` is plain-text.

After the change, `config.authp` is the hash. The correct call becomes:
`bcrypt.compareSync(data, config.authp)` — the plain-text from the client is
the first argument, the hash from `.env` is the second.

### 3.3 JWT `auth` Claim — Hashed Value

Currently JWTs carry `auth: config.authp` (plain text). After change, JWTs
carry `auth: config.authp` (the hash string). Verification in all auth
middlewares already does `decoded.auth == config.authp`, so no change needed
— both sides are now the same hash value.

### 3.4 Backward Compatibility — No Plain-Text Fallback

Unlike room passwords (which have a backward-compatible `|| stored === pass`
fallback for legacy data), `AUTH_P` is a server-side environment variable.
There is no legacy data to support. Once the env var is hashed, all
deployments must use the hashed value. No fallback.

### 3.5 Google OAuth Password Composition

For Google OAuth users, the password is hashed as:
`bcrypt.hashSync(sub + normalizedName + config.authp, salt)`. After the change,
`config.authp` is the bcrypt hash string. The composition changes from
`sub + normalizedName + "plaintext"` to `sub + normalizedName + "$2b$12$..."`.
This is acceptable — it's just a different input string to bcrypt. Existing
OAuth users will need their passwords reset or re-authenticated, which
matches the deployment expectation: the `.env` change is a one-time migration.

## 4. Startup Validation Location

The check runs in `config/config.js` at module load time, before any route or
service is initialized. This guarantees that no request can reach the server
with an invalid AUTH_P.

## 5. .env Migration — One-Time Hashing of AUTH_P

The implementer MUST perform the following migration step on the `.env` file
as part of this feature:

1. Read the current value of `AUTH_P` from `.env`.
2. Check whether the value is already a bcrypt hash (matches
   `/^\$2[aby]\$\d{2}\$.+/`).
3. If it is already a hash, skip (idempotent — safe to run multiple times).
4. If it is plain text, compute `bcrypt.hashSync(plainTextValue, 12)` and
   replace the `AUTH_P=` line in `.env` with the hashed value.

This is a **one-time migration** performed in the same commit. The `.env` file
in the repository is intentionally updated so the server can start with the
new startup validation immediately. The implementer should NOT add a runtime
migration — the `.env` file mutation is done once, by hand or script, and
committed.