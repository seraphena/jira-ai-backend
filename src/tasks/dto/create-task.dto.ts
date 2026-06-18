
import { IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

// ─────────────────────────────────────────────────────────────────────────────
// Closed-set constants
// Declared once here so the @IsIn() validators and the exported union types
// always derive from the same source of truth. Adding "REVIEW" means touching
// exactly one line — never hunting across files.
// ─────────────────────────────────────────────────────────────────────────────
export const TASK_STATUSES   = ['TODO', 'IN_PROGRESS', 'DONE']          as const;
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH']                 as const;

export type TaskStatus   = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/**
 * CreateTaskDto — the validated shape of a POST /tasks request body.
 *
 * class-validator decorators run inside NestJS's global ValidationPipe
 * (configured with { whitelist: true, forbidNonWhitelisted: true }).
 * Malformed or unexpected payloads are rejected with HTTP 400 *before*
 * they reach the service layer — no defensive checks needed in business logic.
 *
 * { whitelist: true }            → strips unknown properties silently.
 * { forbidNonWhitelisted: true } → rejects the request if unknown properties
 *                                  are present (prevents mass-assignment attacks).
 */
export class CreateTaskDto {
  // Title is the only truly required field — mirrors the Kanban "quick capture"
  // UX pattern where a card is created with just a name, then fleshed out.
  @IsString()
  @MinLength(1,   { message: 'Title must not be empty.' })
  @MaxLength(120, { message: 'Title must not exceed 120 characters.' })
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Description must not exceed 2,000 characters.' })
  description?: string;

  // Status is optional on creation — the schema default ("TODO") handles it.
  // @IsIn rejects unknown column names (e.g. "WONTFIX") at the boundary.
  @IsOptional()
  @IsString()
  @IsIn(TASK_STATUSES, {
    message: `status must be one of: ${TASK_STATUSES.join(', ')}.`,
  })
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  @IsIn(TASK_PRIORITIES, {
    message: `priority must be one of: ${TASK_PRIORITIES.join(', ')}.`,
  })
  priority?: TaskPriority;

  // UUID format validation catches malformed IDs before any DB round-trip.
  // version: 4 enforces the RFC 4122 v4 UUID standard we generate in Prisma.
  @IsOptional()
  @IsUUID(4, { message: 'assigneeId must be a valid UUID v4.' })
  assigneeId?: string;
}