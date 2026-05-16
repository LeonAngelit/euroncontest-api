# Requirements — add_bcrypt_backend

> The bcrypt library has been removed from the client project.
> The backend SHALL now bear full responsibility for all password hashing
> and comparison logic.

## R1

WHEN a user is created with a password, the system SHALL hash the
password with bcrypt (cost factor 12) before persisting it to the
database.

## R2

The system SHALL NOT store user passwords as plain text in the database.

## R3

WHEN a user authenticates via email and password, the system SHALL compare
the plain-text password received from the client directly against the stored
bcrypt hash using `bcrypt.compareSync`.

## R4

WHEN a user authenticates by username and password, the system SHALL compare
the plain-text password received from the client directly against the stored
bcrypt hash using `bcrypt.compareSync`.

## R5

The system SHALL NOT apply any string reversal or transformation to the
password before hashing or comparison.

## R6

WHEN a user's password is updated, the system SHALL hash the new password
with bcrypt before persisting it.

## R7

WHERE a user authenticates via Google OAuth, the system SHALL continue to
generate and store bcrypt-hashed passwords as currently implemented.

## R8

The project SHALL build and start without errors after all bcrypt-related
changes.