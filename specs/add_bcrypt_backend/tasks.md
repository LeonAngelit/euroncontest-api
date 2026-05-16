# Tasks — add_bcrypt_backend

> Executable checklist. Each task references at least one R<n>.
> The implementer marks each `[ ]` as `[x]` upon completion.

- [x] T1 — Add `hashPassword(plainPassword)` helper method to `UserService` in `services/users.service.js` that returns `bcrypt.hashSync(plainPassword, bcrypt.genSaltSync(12))`. Covers: R1, R2, R6.
- [x] T2 — Update `create()` in `services/users.service.js`: hash `data.password` via `this.hashPassword(data.password)` before calling `models.User.create(data)`. Covers: R1, R2.
- [x] T3 — Update `loginByEmail()` in `services/users.service.js`: replace `bcrypt.compareSync(password.split('').reverse().join(''), user.password)` with `bcrypt.compareSync(password, user.password)`. Covers: R3, R5.
- [x] T4 — Update `loginByName()` in `services/users.service.js`: replace `bcrypt.compareSync(password.split('').reverse().join(''), user.password)` with `bcrypt.compareSync(password, user.password)`. Covers: R4, R5.
- [x] T5 — Update `update()` in `services/users.service.js`: if `data.password` is present, replace `data.password` with `this.hashPassword(data.password)` before calling `user.update(data)`. Covers: R6.
- [x] T6 — Verify `accessWithGoogle()` and `middlewares/auth.handler.js` are not modified by the diff. Covers: R7.
- [x] T7 — Run `./init.sh` and confirm the project builds and starts without errors. Covers: R8.
- [x] T8 — Add test: creating a user stores a bcrypt hash, not the plain-text password. Covers: R1, R2.
- [x] T9 — Add test: `loginByEmail()` authenticates with a plain-text password against the stored hash. Covers: R3.
- [x] T10 — Add test: `loginByName()` authenticates with a plain-text password against the stored hash. Covers: R4.
- [x] T11 — Add test: no password reversal or transformation is applied during comparison. Covers: R5.
- [x] T12 — Add test: updating a user with a new password stores a bcrypt hash. Covers: R6.