# Requirements — add_bcrypt_for_room_service

## R1
WHEN a new room is created via `RoomService.create()`, the system SHALL hash the room password with bcrypt (`bcrypt.hashSync`) before storing it in the database.

## R2
WHEN a room password is updated via `RoomService.update()`, the system SHALL hash the new password with bcrypt before persisting the change; IF the update payload does not contain a `password` field, the system SHALL leave the existing hash unchanged.

## R3
WHEN a user logs into a room by name via `RoomService.loginByRoomName()`, the system SHALL compare the provided plain-text password against the stored bcrypt hash using `bcrypt.compareSync`.

## R4
WHEN a user logs into a room by ID via `RoomService.loginById()`, the system SHALL compare the provided plain-text password against the stored bcrypt hash using `bcrypt.compareSync`; the system SHALL NOT apply any reversal or transformation to the password before comparison.

## R5
The `RoomService` class SHALL expose a `hashPassword(plainPassword)` method that returns `bcrypt.hashSync(plainPassword, bcrypt.genSaltSync(12))`, consistent with the pattern used in `UserService`.

## R6
IF a stored room password does not match a bcrypt hash format (i.e., does not start with `$2b$`), the system SHALL still support backward-compatible login by comparing the provided password against the plain-text stored value, so that existing rooms created before this feature are not locked out.

## R7
All unit tests for room password handling SHALL verify that: (a) `create()` stores a bcrypt hash and not plain text, (b) `loginByRoomName()` accepts correct plain-text passwords and rejects incorrect ones, (c) `loginById()` accepts correct plain-text passwords and rejects incorrect ones, (d) `update()` hashes a new password when provided and does not modify other fields.

## R8
The `ARCHITECTURE.md` document SHALL be updated to reflect that room passwords are now stored as bcrypt hashes and that the `RoomService` uses `bcrypt.hashSync` / `bcrypt.compareSync` for room password operations.

## R9
IF the room password field is not present in an update request body, the system SHALL NOT hash or modify the password column in the database.

## R10
The project SHALL NOT have any build or lint errors after all changes are applied.