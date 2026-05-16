# Tasks — add_bcrypt_for_room_service

- [x] T1 — Add `hashPassword(plainPassword)` method to `RoomService` class in `services/rooms.service.js`. Returns `bcrypt.hashSync(plainPassword, bcrypt.genSaltSync(12))`. Covers: R5.

- [x] T2 — In `RoomService.create()`, call `this.hashPassword(data.password)` and assign the result back to `data.password` before `models.Room.create(data)`. Covers: R1.

- [x] T3 — In `RoomService.update()`, add a conditional check: `if (data.password) { data.password = this.hashPassword(data.password); }` before `room.update(data)`. Covers: R2, R9.

- [x] T4 — In `RoomService.loginByRoomName()`, update the password comparison to support backward compatibility: replace `bcrypt.compareSync(data.password, room.password)` with `(bcrypt.compareSync(data.password, room.password) || data.password === room.password)`. Covers: R3, R6.

- [x] T5 — In `RoomService.loginById()`, remove the password reversal (`password.split('').reverse().join('')`) and change the comparison to `(bcrypt.compareSync(password, room.password) || password === room.password)`. Rename method from `loginByRoomId` to `loginById` if not already. Covers: R4, R6.

- [x] T6 — Create `tests/rooms.service.test.js` with the following test cases:
  - `create()` stores a bcrypt hash, not plain text
  - `create()` produces a hash verifiable with `bcrypt.compareSync`
  - `loginByRoomName()` authenticates with correct plain-text password against stored hash
  - `loginByRoomName()` rejects an incorrect password
  - `loginByRoomName()` authenticates with correct plain-text password against stored plain text (backward compat)
  - `loginById()` authenticates with correct plain-text password against stored hash (no reversal)
  - `loginById()` rejects an incorrect password
  - `loginById()` authenticates with correct plain-text password against stored plain text (backward compat)
  - `update()` hashes password when provided and does not modify other fields
  - `update()` does not hash when password field is absent from update payload
  Covers: R1, R2, R3, R4, R5, R6, R7, R9.

- [x] T7 — Update `ARCHITECTURE.md`: document that room passwords are stored as bcrypt hashes, that `RoomService` uses `bcrypt.hashSync`/`bcrypt.compareSync` with 12 salt rounds, and that backward-compatible plain-text login is supported during transition. Add/update Known Issues section. Covers: R8.

- [x] T8 — Run `./init.sh` and verify the project builds and all tests pass with no errors. Covers: R10.