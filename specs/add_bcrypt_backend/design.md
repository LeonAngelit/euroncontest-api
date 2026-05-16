# Design — add_bcrypt_backend

> Technical decisions explaining HOW each requirement will be implemented.

## D1 — Password hashing helper (R1, R2, R6)

Add a private helper method `hashPassword(plainPassword)` to
`services/users.service.js` that returns `bcrypt.hashSync(plainPassword, bcrypt.genSaltSync(12))`.

This centralises the hashing logic (cost factor 12, matching the existing
`accessWithGoogle` convention) in a single method so both `create()` and
`update()` call the same function.

## D2 — Hash passwords on user creation (R1, R2)

In `services/users.service.js`, modify the `create(data)` method: before
calling `models.User.create(data)`, replace `data.password` with
`this.hashPassword(data.password)`. This replaces the current plain-text
storage with a bcrypt hash.

The existing behaviour of the rest of `create()` — token generation,
email verification, returning `{ user, token }` — remains unchanged.

## D3 — Remove password reversal in login methods (R3, R4, R5)

In `services/users.service.js`, update both `loginByEmail()` and
`loginByName()`:

- Replace `bcrypt.compareSync(password.split('').reverse().join(''), user.password)`
  with `bcrypt.compareSync(password, user.password)`.

The client no longer reverses passwords (bcrypt was removed from the
frontend), so the backend must accept plain-text passwords and compare
them directly against the stored hash.

## D4 — Hash passwords on user update (R6)

In `services/users.service.js`, modify the `update(id, data)` method:
if `data.password` is present, replace it with
`this.hashPassword(data.password)` before calling `user.update(data)`.

The current `update()` passes `data` through to Sequelize unchanged,
meaning a plain-text password in the request body would be stored as-is.
After this change, any password field is hashed before persistence.

## D5 — Google OAuth — no changes (R7)

`accessWithGoogle()` already generates a bcrypt hash via
`bcrypt.genSaltSync(12)` and `bcrypt.hashSync(...)`. This code path is
correct and shall not be modified.

`middlewares/auth.handler.js` uses `bcrypt.compareSync(config.authp, data)`
for header-based auth token verification. This is unrelated to user password
handling and shall not be modified.

## D6 — Build integrity (R8)

After changes, run `./init.sh` to verify the project builds and starts
without errors. No new dependencies are needed — `bcrypt` is already in
`package.json`.

## Files to modify

| File                              | Changes                                                | Requirements |
|-----------------------------------|--------------------------------------------------------|--------------|
| `services/users.service.js`       | Add `hashPassword()`; update `create()`, `loginByEmail()`, `loginByName()`, `update()` | R1–R6        |
| `tests/`                          | Add unit tests for hashing and comparison logic        | R1–R6        |

## Out of scope

- Database migration script for existing plain-text passwords.
  Existing users registered via `create()` have plain-text passwords in the
  database. After this change, `bcrypt.compareSync(plainPassword, plainText)`
  will return `false` for those users because `bcrypt.compareSync` expects
  the second argument to be a bcrypt hash. A password-reset flow or a
  one-time migration script is recommended but falls outside the scope of
  this feature.
- Changes to `middlewares/auth.handler.js` — header auth uses a different
  mechanism and does not involve user passwords.
- Frontend changes — the client has already removed bcrypt.