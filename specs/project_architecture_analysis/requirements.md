# requirements.md — Project Architecture Analysis

## R1

The system SHALL produce an `ARCHITECTURE.md` file at the project root that
replaces the current placeholder content.

## R2

The `ARCHITECTURE.md` file SHALL contain a **System Overview** section that
describes the project name (`EuronContest API`), purpose (a Eurovision-style
contest voting backend), runtime (Node.js + Express), and primary database
(PostgreSQL via Sequelize).

## R3

The `ARCHITECTURE.md` file SHALL contain a **Tech Stack** section that lists
every runtime dependency present in `package.json` grouped by role
(framework, ORM, auth, validation, image handling, email, web scraping,
testing, deployment) together with each version constraint.

## R4

The `ARCHITECTURE.md` file SHALL contain a **Component Map** section that
documents every top-level module (`index.js`, `config/`, `db/models/`,
`lib/`, `routes/`, `services/`, `schemas/`, `middlewares/`, `utils/`,
`dictionaries/`, `src/`, `tests/`) and each module's single responsibility.

## R5

The `ARCHITECTURE.md` file SHALL contain a **Data Flow** section that
illustrates the request lifecycle: Client → Express → Middleware chain
(auth → validation) → Service → Model (Sequelize / MongoDB) → Response,
including the error-handling pipeline (`logErrors` → `boomErrorHandler` →
`sequelizeError` → `errorHandler`).

## R6

The `ARCHITECTURE.md` file SHALL contain an **API Endpoints** section that
enumerates all route groups mounted under `/api/eurocontest` (users, rooms,
countries, archive, getAuthToken, updatable, requests), each with the HTTP
methods available and the auth level required (none / `jwtAuth` /
`jwtAuthHighLevel` / `jwtAuthAdminLevel` / `headerAuth`).

## R7

The `ARCHITECTURE.md` file SHALL contain a **Database Schema** section that
describes every Sequelize model table (`users`, `countries`, `rooms`,
`rooms_users`, `users_countries`, `updatable`) with its columns, types, and
constraints, plus all associations between models (Many-to-Many through
junction tables, foreign keys, and the `adminId` relationship).

## R8

The `ARCHITECTURE.md` file SHALL contain an **Environment & Deployment**
section that documents environment-based configuration (`config/config.js`),
Docker support (`Dockerfile`, `compose.yaml`), Vercel deployment
(`vercel.json`), and Sequelize migration workflow.

## R9

The `ARCHITECTURE.md` file SHALL contain a **Known Issues & Conventions**
section that lists existing code conventions (Joi validation pattern,
service class pattern, Boom error pattern) and notable issues
(e.g. `middlewares/` directory typo, `src/` containing legacy notes-cli code).

## R10

WHEN a developer needs to understand where to add a new endpoint or a new
model, the `ARCHITECTURE.md` file SHALL provide enough detail to locate the
correct route, service, schema, and model files without reading every source
file.
