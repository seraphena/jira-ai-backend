# Jira AI Backend

A production-grade Kanban task management REST API built with NestJS, Prisma 7, and PostgreSQL.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| NestJS | Backend framework with TypeScript |
| Prisma 7 | Type-safe ORM with PostgreSQL adapter |
| PostgreSQL | Relational database running in Docker |
| TypeScript | Strict typing throughout |
| Docker | Containerised database environment |

## Architecture
HTTP Request

↓

ParseUUIDPipe       → validates UUID path params

↓

ValidationPipe      → validates request body via DTOs

↓

TasksController     → routes request to correct method

↓

TasksService        → business logic and error handling

↓

Prisma ORM          → type-safe database queries

↓

PostgreSQL          → persistent data storage

## Data Models

- **User** — board member who owns tasks and writes comments
- **Task** — Kanban card with status, priority, and optional assignee
- **Comment** — threaded activity attached to a task card

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /tasks | Create a new task card |
| GET | /tasks | Get all tasks ordered newest first |
| GET | /tasks/:id | Get one task with assignee and comments |
| PATCH | /tasks/:id | Partially update a task |
| DELETE | /tasks/:id | Delete a task and return deleted record |

## Running Locally

```bash
# 1. Start the PostgreSQL database
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Run database migrations
npx prisma migrate dev

# 4. Start the development server
npm run start:dev
```

Server runs on http://localhost:3000

## Key Engineering Decisions

- `ParseUUIDPipe` on every route param — rejects malformed IDs before hitting the database
- `handlePrismaError` with `never` return type — centralised P2025 error translation
- `TASK_INCLUDE` constant — consistent relational hydration across all queries
- `PartialType(CreateTaskDto)` — update DTO stays in sync with create DTO automatically
- `@Global()` on PrismaModule — database connection available everywhere without re-importing
- Atomic write operations — catch errors on the write itself, not a pre-flight check

