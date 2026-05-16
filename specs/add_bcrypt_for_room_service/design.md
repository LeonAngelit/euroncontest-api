# Design — add_bcrypt_for_room_service

## Files Modified

| File | Change |
|------|--------|
| `services/rooms.service.js` | Add `hashPassword()` method; hash password in `create()` and `update()`; remove password reversal in `loginByRoomId()` |
| `tests/rooms.service.test.js` | New file — unit tests for bcrypt room password handling (create, login, update) |
| `ARCHITECTURE.md` | Update room service and auth sections to document bcrypt hashed room passwords |

## New Signatures

### `RoomService.hashPassword(plainPassword)`

```js
hashPassword(plainPassword) {
  return bcrypt.hashSync(plainPassword, bcrypt.genSaltSync(12));
}
```

Follows the same pattern as `UserService.hashPassword()` in `services/users.service.js:19-21`. Uses `genSaltSync(12)` (12 rounds) for consistency with the user service.

## Detailed Changes

### `services/rooms.service.js`

1. **`create(data)`** — Before `models.Room.create(data)`, add:
   ```js
   data.password = this.hashPassword(data.password);
   ```
   This ensures the room password is hashed before being stored.

2. **`update(id, data)`** — Before `room.update(data)`, add:
   ```js
   if (data.password) {
     data.password = this.hashPassword(data.password);
   }
   ```
   This hashes the password only when it is present in the update payload. If `password` is absent, the field is left unchanged per Sequelize's default behavior (partial update).

3. **`loginByRoomName(data)`** — Already uses `bcrypt.compareSync(data.password, room.password)` on line 64. **No change needed.** This works correctly against a bcrypt hash because `bcrypt.compareSync(plaintext, hash)` returns `true` when the plaintext matches the hash. However, a backward-compatible fallback is needed for plain-text passwords (see R6).

4. **`loginByRoomId(id, password, userId)`** — Line 80 currently reverses the password before comparison:
   ```js
   bcrypt.compareSync(password.split('').reverse().join(''), room.password)
   ```
   This must be changed to:
   ```js
   bcrypt.compareSync(password, room.password)
   ```
   The password reversal was a legacy obfuscation that is incompatible with bcrypt hashing. This aligns with R4.

5. **Backward compatibility (R6)** — Both `loginByRoomName` and `loginByRoomId` need a fallback for plain-text stored passwords (rooms created before this feature). The comparison logic becomes:
   ```js
   const isMatch = bcrypt.compareSync(plainPassword, storedPassword) ||
     storedPassword === plainPassword;
   ```
   This allows existing plain-text passwords to still work until they are naturally replaced (e.g., via room update). `bcrypt.compareSync` against a non-hash string always returns `false`, so this is safe.

### `tests/rooms.service.test.js`

New Vitest test file covering:
- `create()` stores a bcrypt hash, not plain text (R1, R5)
- `loginByRoomName()` authenticates with correct password against hash (R3)
- `loginByRoomName()` rejects incorrect password (R3)
- `loginById()` authenticates with correct password without reversal (R4)
- `loginById()` rejects incorrect password (R4)
- Backward compatibility: plain-text stored passwords still work (R6)
- `update()` hashes password when provided (R2)
- `update()` does not hash when password is absent (R9)
- No build errors (R10)

### `ARCHITECTURE.md`

Update the Rooms section and Known Issues to document:
- Room passwords are stored as bcrypt hashes
- `RoomService` uses `bcrypt.hashSync` (with 12 salt rounds) for hashing and `bcrypt.compareSync` for verification
- Plain-text passwords are still supported for backward compatibility during login

## Exceptions

No new exception types. Existing `boom.unauthorized()` and `boom.conflict()` are reused.

## Alternatives Discarded

### Alternative: Database migration to hash all existing plain-text room passwords
A one-time migration script that re-hashes all existing plain-text room passwords was considered. **Discarded** because: (a) it requires DB access at migration time, which is fragile in production; (b) backward-compatible comparison (`bcrypt.compareSync || plain === plain`) is safer and simpler; (c) passwords will naturally be re-hashed when room admins update them. The backward-compatible login approach (R6) handles the transition gracefully.

### Alternative: Using `bcrypt.compare` (async) instead of `bcrypt.compareSync`
The project consistently uses synchronous bcrypt methods throughout (`hashSync`, `compareSync`, `genSaltSync`) — in `UserService`, `auth.handler`, and the existing `RoomService` login methods. Switching to async would break the established pattern without measurable benefit in this Express request-handler context. **Discarded** for consistency.