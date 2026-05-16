# EuronContest API — Architecture

## 1. System Overview

**EuronContest API** is a Node.js + Express backend for a Eurovision-style contest
voting platform. Users create accounts, pick countries to vote for, join or
create rooms, and compete for points based on real Eurovision results. The
system distinguishes three authentication levels (basic JWT, high-level JWT
with user binding, and admin-level JWT) and exposes a REST API mounted under
`/api/eurocontest`. Primary data is stored in **PostgreSQL** via **Sequelize
v6**, while archived results and AI/ComfyUI request queues use **MongoDB**.
Image uploads go through **Cloudinary**. The project runs on Node.js and
deploys via **Vercel** or **Docker Compose**.

---

## 2. Tech Stack

| Role                      | Package               | Version      |
| ------------------------- | --------------------- | ------------ |
| **Framework**             | `express`             | ^4.21.2      |
| **ORM (PostgreSQL)**      | `sequelize`           | ^6.37.5      |
| **ORM CLI**               | `sequelize-cli`       | ^6.6.2       |
| **PostgreSQL driver**     | `pg`                  | ^8.13.3      |
| **PostgreSQL types**      | `pg-hstore`           | ^2.3.4       |
| **MySQL driver** (legacy) | `mysql2`              | ^3.12.0      |
| **MongoDB driver**        | `mongodb`             | ^6.13.1      |
| **Auth / JWT**            | `jsonwebtoken`        | ^9.0.2       |
| **Password hashing**      | `bcrypt`              | ^5.1.1       |
| **Google OAuth**          | `google-auth-library` | ^9.15.1      |
| **Validation**            | `joi`                 | ^17.13.3     |
| **Error handling**        | `@hapi/boom`          | ^10.0.1      |
| **File upload**           | `multer`              | ^1.4.5-lts.1 |
| **Image hosting**         | `cloudinary`          | ^2.5.1       |
| **Email**                 | `nodemailer`          | ^6.10.1      |
| **HTTP client**           | `axios`               | ^1.9.0       |
| **Web scraping**          | `puppeteer-core`      | ^24.2.1      |
| **Chromium binary**       | `@sparticuz/chromium` | ^132.0.0     |
| **CORS**                  | `cors`                | ^2.8.5       |
| **Env vars**              | `dotenv`              | ^16.4.7      |
| **Test data**             | `faker`               | ^5.5.3       |
| **Testing**               | `vitest`              | ^4.1.6       |
| **Linting**               | `eslint`              | ^9.21.0      |
| **Formatting**            | `prettier`            | ^3.5.1       |
| **Dev server**            | `nodemon`             | ^3.1.9       |

---

## 3. Component Map

| Module           | Responsibility                                                                                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.js`       | Entry point — creates Express app, loads CORS, JSON parser, mounts routes via `routerApi()`, registers error-handling middleware chain                                                                     |
| `config/`        | Environment-based configuration (`config/config.js`) — loads `.env`, exposes DB credentials, JWT keys, regex patterns, MongoDB URL, Cloudinary keys, email settings, ComfyUI/AI templates                  |
| `db/models/`     | Sequelize model definitions and associations (`user.model.js`, `country.model.js`, `room.model.js`, `room-user.model.js`, `user-country.model.js`, `updatable.model.js`) plus `index.js` initializer       |
| `db/config.js`   | Sequelize CLI config — reads DB URL from `config/` and sets dialect options per environment                                                                                                                |
| `db/migrations/` | Sequelize migration files for schema creation and alters (e.g. initial schema, `add-tail-option`)                                                                                                          |
| `db/seeders/`    | (empty) Sequelize seeder directory                                                                                                                                                                         |
| `lib/`           | Database connection modules — `sequelize.js` (PostgreSQL via Sequelize) and `mongo.js` (MongoDB client)                                                                                                    |
| `routes/`        | Express route groups — `index.js` (mount point `/api/eurocontest`), `users.js`, `rooms.js`, `countries.js`, `archive.js`, `getAuthToken.js`, `updatable.js`, `requests.js`                                 |
| `services/`      | Business logic layer — class-based services (`UserService`, `RoomService`, `CountryService`, `ArchiveService`, `UpdatableService`, `RequestService`, `ImagesService`). `UserService` and `RoomService` both hash passwords with bcrypt (`hashSync`, 12 salt rounds) before storage and verify with `compareSync`.                                      |
| `schemas/`       | Joi validation schemas — `user.schema.js`, `room.schema.js`, `country.schema.js`, `updatable.schema.js`                                                                                                    |
| `middlewares/`   | Express middleware — `auth.handler.js` (JWT auth functions), `error.handler.js` (error pipeline), `validator.handler.js` (Joi validation). **Note: directory is misspelled as `middlewares` (single 'd')** |
| `utils/`         | Utility modules — `email.util.js` (nodemailer wrapper class), `puppeteer.util.js` (web scraping for country data)                                                                                          |
| `dictionaries/`  | Static reference data — `countries.json` (Eurovision country code → name mapping)                                                                                                                          |
| `src/`           | **Legacy code** — TypeScript CLI notes application (`cli.ts`, `notes.ts`, `features.ts`, `prompts.ts`, `storage.ts`). Not part of the API; kept as historical artifact                                     |
| `tests/`         | Test suite — `cli.test.ts`, `notes.test.ts`, `features.test.ts`, `storage.test.ts`, `cli_features.test.ts` (all testing the legacy `src/` CLI, not the API)                                                |

---

## 4. Data Flow

### Request Lifecycle

```
Client
  │
  ▼
Express (index.js)
  ├── express.json()          — parse JSON body
  ├── cors()                  — allow cross-origin
  └── routerApi(app)          — mount /api/eurocontest routes
        │
        ▼
  Route Handler (routes/*.js)
  ├── Auth Middleware          — jwtAuth / jwtAuthHighLevel / jwtAuthAdminLevel / headerAuth
  ├── Validator Middleware     — validatorHandler(schema, property)
  └── Service Call            — e.g. service.find(), service.create(data)
        │
        ▼
  Service Layer (services/*.js)
  └── Sequelize Model          — db/models/*.js → PostgreSQL
  └── MongoDB Collection       — lib/mongo.js → MongoDB (archive, requests)
        │
        ▼
  Response (JSON)
```

### Auth Levels

| Auth Middleware     | What it does                                                                                                                                       | Used by                                                                           |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `jwtAuth`           | Verifies a JWT token in `req.headers.bearer` contains the correct `auth` claim                                                                     | Endpoints requiring a logged-in user (signup, login, basic CRUD)                  |
| `jwtAuthHighLevel`  | Verifies JWT + checks that `decoded.userId` and `decoded.password` match a real user in DB; obtains user ID from `req.params` or `req.body.userId` | Endpoints modifying user-owned resources (update profile, room operations)        |
| `jwtAuthAdminLevel` | Verifies JWT + ensures the token's `userId` matches the admin user from the `updatable` table (row id=1)                                           | Admin-only endpoints (list all users/rooms, refresh data, manage updatable flags) |
| `headerAuth`        | Verifies `req.headers.authorization` (plain-text) against the bcrypt-hashed `config.authp` using `bcrypt.compareSync(plaintext, hash)` | `GET /api/eurocontest/getAuthToken` — initial token acquisition                   |

### Error-Handling Pipeline

Errors flow through the following middleware chain (registered in `index.js`
after all routes):

```
logErrors(err, req, res, next)     — logs error, passes to next
  └─► boomErrorHandler(err, ...)   — if Boom error (isBoom), sends {statusCode, message, ...}
      └─► sequelizeError(err, ...)  — if Sequelize ValidationError, sends 409 {statusCode, message, errors}
          └─► errorHandler(err, ...)— catch-all, sends 500 {message, stack}
```

---

## 5. API Endpoints

All routes are mounted under **`/api/eurocontest`**.

### Users (`/api/eurocontest/users`)

| Method | Path                     | Auth                | Description                                    |
| ------ | ------------------------ | ------------------- | ---------------------------------------------- |
| GET    | `/`                      | `jwtAuthAdminLevel` | List all users with countries and rooms        |
| GET    | `/:id`                   | `jwtAuthHighLevel`  | Get user by ID                                 |
| GET    | `/validateEmailSent/:id` | `jwtAuth`           | Check if confirmation email was recently sent  |
| GET    | `/isEmailPresent/:id`    | `jwtAuthHighLevel`  | Check if user has an email address             |
| GET    | `/validateToken/:id`     | `jwtAuthHighLevel`  | Validate user token freshness                  |
| POST   | `/login`                 | `jwtAuth`           | Login by username or email                     |
| POST   | `/google-login`          | `jwtAuth`           | Login/register via Google OAuth                |
| POST   | `/signup`                | `jwtAuth`           | Register a new user                            |
| POST   | `/add-country`           | `jwtAuthHighLevel`  | Add a single country selection to user         |
| POST   | `/bulk/add-country`      | `jwtAuthHighLevel`  | Bulk set user's country selections             |
| PUT    | `/:id`                   | `jwtAuthHighLevel`  | Replace user (image upload via multer or body) |
| PATCH  | `/:id`                   | `jwtAuth`           | Partial update user (image upload or body)     |
| POST   | `/updateUserEmail/:id`   | `jwtAuthHighLevel`  | Confirm email change with token                |
| POST   | `/sendWinnerEmail`       | `jwtAuthAdminLevel` | Generate and send winner certificate email     |
| DELETE | `/:id`                   | `jwtAuth`           | Delete a user by ID                            |

### Rooms (`/api/eurocontest/rooms`)

Room passwords are stored as **bcrypt hashes** using `bcrypt.hashSync` with 12
salt rounds (`RoomService.hashPassword()`). On login, passwords are verified
with `bcrypt.compareSync`. A backward-compatible fallback (`plain === stored`)
allows existing rooms created before this feature — which still have
plain-text passwords — to continue working until administrators update them.

| Method | Path                             | Auth                | Description                                     |
| ------ | -------------------------------- | ------------------- | ----------------------------------------------- |
| GET    | `/`                              | `jwtAuthAdminLevel` | List all rooms                                  |
| GET    | `/:roomId/:id`                   | `jwtAuthHighLevel`  | Get room if user is member                      |
| GET    | `/name/:name`                    | `jwtAuth`           | Find room by name                               |
| GET    | `/archive/export/:year`          | `jwtAuthAdminLevel` | Export room results to MongoDB archive          |
| GET    | `/generateRoomToken/:roomId/:id` | `jwtAuthHighLevel`  | Generate a room invitation token                |
| GET    | `/:id/stream`                    | None                | SSE stream for room data (polling 60s interval) |
| POST   | `/`                              | `jwtAuth`           | Create a new room                               |
| POST   | `/login`                         | `jwtAuthHighLevel`  | Join room by name + password                    |
| POST   | `/remove-user`                   | `jwtAuthHighLevel`  | Remove user from room                           |
| POST   | `/verifyRoomToken/:id`           | `jwtAuthHighLevel`  | Verify and join via room invitation token       |
| PUT    | `/:roomId/:id`                   | `jwtAuthHighLevel`  | Update room (admin only)                        |
| PATCH  | `/:id`                           | `jwtAuth`           | Partial update room                             |
| DELETE | `/:roomId/:id`                   | `jwtAuthHighLevel`  | Delete room (admin only)                        |

### Countries (`/api/eurocontest/countries`)

| Method | Path                 | Auth                | Description                                            |
| ------ | -------------------- | ------------------- | ------------------------------------------------------ |
| GET    | `/`                  | `jwtAuth`           | List all countries                                     |
| GET    | `/:id`               | `jwtAuth`           | Get country by ID                                      |
| GET    | `/refresh/:year`     | `jwtAuthAdminLevel` | Scrape latest country data and recalculate user points |
| GET    | `/getUpdate/:year`   | `jwtAuth`           | Get updated country data without persisting            |
| GET    | `/open/:year`        | `jwtAuth`           | Open the live data page                                |
| GET    | `/updateLinks/:year` | `jwtAuthAdminLevel` | Scrape video links for countries                       |
| POST   | `/`                  | `jwtAuthAdminLevel` | Create a new country                                   |
| PUT    | `/:id`               | `jwtAuth`           | Replace country data                                   |
| PATCH  | `/:id`               | `jwtAuth`           | Partial update country                                 |
| DELETE | `/:id`               | `jwtAuth`           | Delete country                                         |

### Archive (`/api/eurocontest/archive`)

| Method | Path                | Auth                | Description                                |
| ------ | ------------------- | ------------------- | ------------------------------------------ |
| GET    | `/`                 | `jwtAuthAdminLevel` | List all archived results                  |
| GET    | `/room/:roomId/:id` | `jwtAuthHighLevel`  | Get archive entry if user is a room member |
| GET    | `/users/:id`        | `jwtAuthHighLevel`  | Find archives by username                  |

### GetAuthToken (`/api/eurocontest/getAuthToken`)

| Method | Path | Auth         | Description                                                      |
| ------ | ---- | ------------ | ---------------------------------------------------------------- |
| GET    | `/`  | `headerAuth` | Issue a short-lived JWT (20 min) after verifying master password |

### Updatable (`/api/eurocontest/updatable`)

| Method | Path     | Auth                | Description                        |
| ------ | -------- | ------------------- | ---------------------------------- |
| GET    | `/`      | `jwtAuthAdminLevel` | Get current updatable status flags |
| PUT    | `/`      | `jwtAuthAdminLevel` | Update updatable flags             |
| POST   | `/users` | `jwtAuthAdminLevel` | Block/allow user registration      |

### Requests (`/api/eurocontest/<dynamic>`)

> The mount path for requests is configurable via the `REQUESTS_ENDPOINT`
> env variable (`config.requestsEndpoint`).

| Method | Path          | Auth                | Description                                                                                  |
| ------ | ------------- | ------------------- | -------------------------------------------------------------------------------------------- |
| POST   | `/addRequest` | `jwtAuthAdminLevel` | Enqueue a ComfyUI AI request (image_to_video, upscale, clean, generate_image, anime_to_real) |
| DELETE | `/`           | `jwtAuthAdminLevel` | Delete all AI requests from MongoDB                                                          |

---

## 6. Database Schema

### PostgreSQL Tables (Sequelize)

#### `users`

| Column       | Type    | Constraints                 |
| ------------ | ------- | --------------------------- |
| `id`         | INTEGER | PK, auto-increment          |
| `username`   | STRING  | NOT NULL, UNIQUE            |
| `password`   | STRING  | NOT NULL                    |
| `color`      | STRING  | default `'#FFFFFF'`         |
| `image`      | STRING  | nullable                    |
| `points`     | INTEGER | default `0`                 |
| `token`      | STRING  | nullable                    |
| `email`      | STRING  | nullable                    |
| `email_sent` | STRING  | nullable                    |
| `sub`        | STRING  | nullable (Google OAuth sub) |

> `timestamps: false`

#### `countries`

| Column     | Type    | Constraints        |
| ---------- | ------- | ------------------ |
| `id`       | INTEGER | PK, auto-increment |
| `name`     | STRING  | NOT NULL, UNIQUE   |
| `code`     | STRING  | NOT NULL, UNIQUE   |
| `song`     | STRING  | UNIQUE, nullable   |
| `position` | INTEGER | NOT NULL           |
| `points`   | INTEGER | NOT NULL           |
| `link`     | STRING  | nullable           |

> `timestamps: false`

#### `rooms`

| Column     | Type    | Constraints                                            |
| ---------- | ------- | ------------------------------------------------------ |
| `id`       | INTEGER | PK, auto-increment                                     |
| `name`     | STRING  | NOT NULL, UNIQUE                                       |
| `password` | STRING  | NOT NULL — stored as bcrypt hash (12 salt rounds)      |
| `admin_id` | INTEGER | FK → `users.id`, ON UPDATE CASCADE, ON DELETE SET NULL |

> `timestamps: false`. Room passwords are hashed with `bcrypt.hashSync` via
> `RoomService.hashPassword()` before storage. Login verifies with
> `bcrypt.compareSync`, with a plain-text fallback for backward compatibility.

#### `rooms_users` (junction table)

| Column    | Type    | Constraints                                           |
| --------- | ------- | ----------------------------------------------------- |
| `id`      | INTEGER | PK, auto-increment                                    |
| `room_id` | INTEGER | FK → `rooms.id`, ON UPDATE CASCADE, ON DELETE CASCADE |
| `user_id` | INTEGER | FK → `users.id`, ON UPDATE CASCADE, ON DELETE CASCADE |

> Unique constraint: `(user_id, room_id)` — a user cannot join the same room twice.
> `timestamps: false`

#### `users_countries` (junction table)

| Column          | Type    | Constraints                                               |
| --------------- | ------- | --------------------------------------------------------- |
| `id`            | INTEGER | PK, auto-increment                                        |
| `user_id`       | INTEGER | FK → `users.id`, ON UPDATE CASCADE, ON DELETE CASCADE     |
| `country_id`    | INTEGER | FK → `countries.id`, ON UPDATE CASCADE, ON DELETE CASCADE |
| `winner_option` | BOOLEAN | NOT NULL, default `false`                                 |
| `tail_option`   | BOOLEAN | NOT NULL, default `false`                                 |

> Unique constraint: `(user_id, country_id)` — no duplicate country selections.
> Hook: `beforeValidate` prevents more than one `winner_option: true` per user.
> `timestamps: false`

#### `updatable`

| Column              | Type    | Constraints              |
| ------------------- | ------- | ------------------------ |
| `id`                | INTEGER | PK, auto-increment       |
| `updatable`         | BOOLEAN | NOT NULL, UNIQUE         |
| `updatable_user`    | BOOLEAN | NOT NULL, UNIQUE         |
| `master_password`   | STRING  | NOT NULL                 |
| `refresh_enabled`   | BOOLEAN | NOT NULL, default `true` |
| `last_updated_year` | INTEGER | NOT NULL                 |

> `timestamps: false`. Single-row config table (row id=1 used as app-wide feature flags).

### Model Associations

```
User N──N Country        (through UserCountry, FK: userId, countryId)
User N──N Room            (through RoomUser, FK: userId, roomId)
User 1──N UserCountry     (as 'winnerOption', FK: userId)
User 1──N UserCountry     (as 'tailOption', FK: userId)
Room N──N User            (through RoomUser, FK: roomId, userId)
Room ──► User             (adminId → users.id)
UserCountry belongsTo User (FK: userId)
```

### MongoDB Collections

| Collection                        | Source Config           | Purpose                                     |
| --------------------------------- | ----------------------- | ------------------------------------------- |
| `config.mongoCollectionName`      | `config.mongoRSName` DB | Archived contest results (year + room data) |
| `config.mongoComfyCollectionName` | `config.mongoRSName` DB | ComfyUI AI request queue                    |

---

## 7. Environment & Deployment

### Configuration (`config/config.js`)

All secrets and configuration come from environment variables loaded via
`dotenv`. Key variables:

| Variable                                                                | Purpose                                                                      |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `NODE_ENV`                                                              | `dev` (default) or `production` — controls Sequelize SSL and dialect options |
| `PORT`                                                                  | Server port (default 3000 in config, 3020 in `index.js`)                     |
| `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_NAME`, `DB_PORT`               | PostgreSQL connection parts                                                  |
| `DATABASE_URL`                                                          | Full PostgreSQL connection URL (preferred)                                   |
| `P_KEY`                                                                 | JWT signing key                                                              |
| `AUTH_P`                                                                | Bcrypt-hashed master auth phrase. The server validates on startup that this is a valid bcrypt hash (`$2[aby]$NN$...`). The frontend sends the plain-text password; the backend verifies with `bcrypt.compareSync(plaintext, config.authp)`. The JWT `auth` claim carries this hashed value. |
| `DRIVE_ID`                                                              | Google OAuth client ID                                                       |
| `MAIL_SERVER`, `MAIL_PASS`, `USER_MAIL`                                 | Nodemailer SMTP config                                                       |
| `CONFIRM_EMAIL_URL`                                                     | Base URL for email confirmation links                                        |
| `MONGO_USER`, `MONGO_PASS`, `MONGO_DOMAIN`, `MONGO_APP_NAME`            | MongoDB Atlas connection                                                     |
| `MONGO_RS_NAME`, `MONGO_COLLECTION_NAME`, `MONGO_COMFY_COLLECTION_NAME` | MongoDB collection names                                                     |
| `REQUESTS_ENDPOINT`                                                     | URL path for the requests route group                                        |
| `IMAGES_CLOUD_NAME`, `IMAGES_API_KEY`, `IMAGES_API_SECRET`              | Cloudinary credentials                                                       |
| `BASE_URL`, `FIRST_YEAR`, `FIRST_YEAR_SCRIPT`                           | Eurovision data scraping URLs                                                |
| `URL_VIDEOS`                                                            | Eurovision video page URL for link scraping                                  |

### Sequelize CLI (`.sequelizerc`)

```
config:   ./db/config.js
models:   ./db/models/
migrations: ./db/migrations/
seeders:  ./db/seeders/
```

**Migration commands:**

```bash
npm run migration:generate -- --name <name>   # Create a new migration
npm run migration:run                           # Run pending migrations
npm run migration:revert                        # Undo last migration
npm run migration:delete                        # Undo all migrations
```

`npm run build` and `npm run vercel-build` both run `migration:run`.

### Docker

**`Dockerfile`** — multi-stage build:

1. Installs production dependencies using npm ci with cache mount
2. Copies source code
3. Runs as non-root user on `node`
4. Exposes port 3020
5. CMD: `node index.js`

**`compose.yaml`** — two services:

- `server`: builds from Dockerfile, exposes `3020:3020`, uses `.env`
- `db` (commented-out example): PostgreSQL with health check, persistent volume, secrets

### Vercel (`vercel.json`)

```json
{
  "version": 2,
  "builds": [{ "src": "index.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "index.js", "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"] }]
}
```

All HTTP methods route to `index.js`. The `vercel-build` script runs
Sequelize migrations before deployment.

---

## 8. Known Issues & Conventions

### Code Conventions

- **Service classes**: Each domain has a `*Service` class exported from
  `services/*.service.js`. Instantiated with `new` at module level in routes.
- **Joi validation**: Schemas in `schemas/*.schema.js`. Applied via
  `validatorHandler(schema, property)` middleware which validates `req[property]`
  and calls `next(boom.badRequest(...))` on failure.
- **Boom errors**: All business-logic errors use `@hapi/boom` (e.g.
  `boom.notFound()`, `boom.unauthorized()`, `boom.conflict()`).
- **Sequelize model pattern**: Each model exports `{ TABLE, Schema, Model }`.
  Models are initialized in `db/models/index.js` via `setupModels(sequelize)`.
  Associations declared in `static associate(models)`.
- **Config singleton**: `config/config.js` reads `.env` once and exports a
  plain object. Regex patterns are defined in config for reuse in schemas.

### Known Issues

1. **`src/` contains legacy CLI code**: The `src/` directory holds a
   TypeScript notes CLI (`cli.ts`, `notes.ts`, etc.) that is unrelated to the
   EuronContest API. The existing `tests/` only test this legacy CLI, not
   the API itself.
2. **Auth middleware side effects**: `jwtAuth`, `jwtAuthHighLevel`, and
   `jwtAuthAdminLevel` call `next(boom.unauthorized(...))` on failure **but
   also call `next()`** unconditionally afterward. This means unauthorized
   requests will proceed to the handler after the error is passed. This is
   a known bug that should be fixed (missing `return` before `next(error)`).
3. **`err instanceof` without negation**: In `errorHandler`, the check
   `!err instanceof ValidationError` uses incorrect operator precedence — it
   evaluates as `(!err) instanceof ValidationError`, always returning `false`.
4. **`UpdatableService.block()` uses raw SQL**: The `block()` method constructs
   raw SQL from user input, which is a SQL injection risk.
5. **Room SSE**: `GET /:id/stream` has no authentication and polls the
   database every 60 seconds.
6. **No API tests**: The `tests/` directory only contains tests for the legacy
   `src/` CLI code. There are no automated tests for the API routes or services.
7. **MySQL driver included**: `mysql2` is a dependency but the project uses
   PostgreSQL. This appears to be a leftover.
8. **Room password backward compatibility**: `RoomService.loginByRoomName()`
   and `RoomService.loginById()` accept both bcrypt-hashed and plain-text
   stored passwords via the fallback `bcrypt.compareSync(pass, stored) ||
   stored === pass`. This allows rooms created before the bcrypt feature to
   keep working. Plain-text passwords should be considered deprecated — they
   will be replaced by bcrypt hashes whenever a room is created or its
   password is updated.

---

## 9. Quick Reference

### Where do I add a new endpoint?

1. **Route** — Create or edit a file in `routes/` (e.g. `routes/myFeature.js`).
   Import the corresponding service and auth/validator middleware.
2. **Route registration** — Add `router.use('/myFeature', myFeatureRouter)` in
   `routes/index.js`.
3. **Service** — Create `services/myFeature.service.js` with a class that
   interacts with Sequelize models via `const { models } = require('./../lib/sequelize')`.
4. **Schema** — Create `schemas/myFeature.schema.js` with Joi schemas for
   request validation.

### Where do I add a new model?

1. **Model definition** — Create `db/models/myFeature.model.js` following the
   `{ TABLE, Schema, Model }` export pattern.
2. **Association** — Add `static associate(models)` and define relationships.
3. **Model registration** — Import in `db/models/index.js` and call
   `MyModel.init()` and `MyModel.associate()`.
4. **Migration** — Run `npm run migration:generate -- --name add-my-feature`
   and write the up/down SQL in `db/migrations/`.

### Where do I add new middleware?

Add the file to `middlewares/` (note the typo — this is the existing directory
name) and import it in the route files that need it.

### Where do I add a new utility?

Add it to `utils/` for general-purpose helpers (e.g. email, scraping) or
`lib/` for database connection modules.

### Where do I add static data?

Add JSON files to `dictionaries/` (e.g. `countries.json`).

### Where do I update environment variables?

Edit `.env` and document new variables in `config/config.js`.
