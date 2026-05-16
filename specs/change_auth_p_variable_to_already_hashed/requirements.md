# Requirements — change_auth_p_variable_to_already_hashed

> The `.env` variable `AUTH_P` currently stores a plain-text master password.
> Various parts of the backend (auth middleware, JWT generation, user service,
> room service) use `config.authp` assuming it is plain text.
> This feature changes `AUTH_P` to hold an **already-hashed** bcrypt value,
> so the frontend sends plain text and the backend verifies with
> `bcrypt.compareSync`.

---

## R1

The `.env` variable `AUTH_P` SHALL contain a bcrypt-hashed string (not plain
text). The system SHALL validate on startup that `AUTH_P` is a valid bcrypt
hash (matching the pattern `$2[aby]$NN$...`).

## R2

WHEN a client sends a plain-text password in the `Authorization` header to
`GET /api/eurocontest/getAuthToken`, the system SHALL verify it by calling
`bcrypt.compareSync(plainTextFromClient, config.authp)` where `config.authp`
is the hashed value from `.env`.

## R3

WHEN the system generates a JWT token (in `getAuthToken`, `UserService`,
`RoomService`), the `auth` claim in the JWT payload SHALL contain the
**hashed** `config.authp` value (not plain text).

## R4

WHEN the system verifies a JWT token's `auth` claim (in `jwtAuth`,
`jwtAuthHighLevel`, `jwtAuthAdminLevel`, and `RoomService.verifyRoomToken`),
the system SHALL compare `decoded.auth` against `config.authp` using strict
equality (since both sides are now the same hashed value).

## R5

WHEN a new user registers via Google OAuth, the system SHALL generate the
user's password hash as `bcrypt.hashSync(sub + normalizedName + config.authp)`,
where `config.authp` is the hashed env value.

## R6

WHEN `UpdatableService.initialize()` creates the initial `updatable` row,
the `master_password` column SHALL store the **hashed** `config.authp` value.

## R7

All existing unit tests SHALL be updated to reflect the new hashed `AUTH_P`
behaviour, and all tests SHALL pass.

## R8

`ARCHITECTURE.md` SHALL be updated to reflect that `AUTH_P` stores a
bcrypt-hashed value, that `headerAuth` verifies with `bcrypt.compareSync`,
and that the `auth` JWT claim carries the hashed value.

## R9

IF `AUTH_P` is missing or not a valid bcrypt hash on startup, the system SHALL
log a warning to `stderr` and refuse to start (exit with code 1).

## R10

The implementer SHALL read the current plain-text value of `AUTH_P` from the
`.env` file, hash it with `bcrypt.hashSync(value, 12)`, and write the hashed
value back into `.env` replacing the plain-text value. This migration SHALL be
performed as part of the implementation, so that the `.env` file is updated
in the same commit.

## R11

IF the `AUTH_P` value in `.env` is already a valid bcrypt hash, the migration
step SHALL NOT re-hash it (idempotent). The implementer SHALL detect this by
checking whether the value matches the bcrypt hash pattern `/^\$2[aby]\$\d{2}\$.+/`.