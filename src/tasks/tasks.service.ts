
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Task } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

// Prisma error code emitted when a write operation targets a row that does
// not exist. Extracted as a constant so the string never lives inline — a typo
// there silently swallows the real error and bypasses our NotFoundException.
const PRISMA_RECORD_NOT_FOUND = 'P2025';

// The shape of a Task with its assignee and comments relations pre-loaded.
// Declaring it here prevents callers from guessing which relations are hydrated.
type TaskWithRelations = Prisma.TaskGetPayload<{
  include: { assignee: true; comments: { include: { user: true } } };
}>;

// Reusable include clause — defined once and referenced in every query so
// the hydration contract stays consistent across all service methods.
const TASK_INCLUDE = {
  assignee: true,
  comments: { include: { user: true } },
} satisfies Prisma.TaskInclude;

@Injectable()
export class TasksService {
  // PrismaService is injected by NestJS's IoC container. `private readonly`
  // signals that this class neither reassigns the dependency nor leaks it —
  // a clean, explicit ownership boundary visible at a glance.
  constructor(private readonly prisma: PrismaService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // Create
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Persists a new task card and returns the fully hydrated record.
   * Prisma's `create` is atomic — either the full row commits or it throws.
   * No pre-flight validation needed: the DTO layer guarantees data integrity
   * before this method is ever invoked.
   */
  async create(createTaskDto: CreateTaskDto): Promise<TaskWithRelations> {
    return this.prisma.task.create({
      data:    createTaskDto,
      include: TASK_INCLUDE,
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Read
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Returns all task cards, newest first.
   * The composite index on (status, createdAt DESC) in the schema means this
   * query is served by an index scan, not a full table scan + sort.
   *
   * No pagination here intentionally — add cursor-based pagination
   * (Prisma's `cursor` + `take`) once the row count exceeds ~1,000.
   */
  async findAll(): Promise<TaskWithRelations[]> {
    return this.prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
      include:  TASK_INCLUDE,
    });
  }

  /**
   * Fetches a single task by ID, throwing NotFoundException when absent.
   * `findUniqueOrThrow` delegates the not-found check to Prisma and emits
   * P2025 on miss — our `handlePrismaError` translates it to HTTP 404.
   */
  async findOne(id: string): Promise<TaskWithRelations> {
    try {
      return await this.prisma.task.findUniqueOrThrow({
        where:   { id },
        include: TASK_INCLUDE,
      });
    } catch (error) {
      this.handlePrismaError(error, id);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Update
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Applies a partial update to the task identified by `id`.
   *
   * Why catch on the UPDATE instead of a pre-flight findUnique?
   * A two-step "check then act" pattern creates a TOCTOU race condition:
   * the row could be deleted between the SELECT and the UPDATE. Catching
   * P2025 on the write itself is fully atomic — one round-trip, zero races.
   */
  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<TaskWithRelations> {
    try {
      return await this.prisma.task.update({
        where:   { id },
        data:    updateTaskDto,
        include: TASK_INCLUDE,
      });
    } catch (error) {
      this.handlePrismaError(error, id);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Delete
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Deletes the task identified by `id` and returns the deleted record.
   * Returning the deleted record lets the client confirm exactly what was
   * removed — useful for audit logs and optimistic-UI rollback.
   */
  async remove(id: string): Promise<Task> {
    try {
      return await this.prisma.task.delete({ where: { id } });
    } catch (error) {
      this.handlePrismaError(error, id);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Centralised Prisma → NestJS HTTP error translation.
   *
   * Keeping this in one place means:
   *   • The P2025 string never appears more than once (no silent typo risk).
   *   • Future Prisma codes (e.g. P2002 unique-constraint violation) are
   *     handled here without touching any service method.
   *
   * Return type `never` is accurate — this function always throws.
   * TypeScript uses it to prove that any code after a call here is unreachable,
   * which is why `update`, `remove`, and `findOne` need no explicit `return`
   * statement inside their catch blocks.
   */
  private handlePrismaError(error: unknown, id: string): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === PRISMA_RECORD_NOT_FOUND
    ) {
      throw new NotFoundException(`Task with id "${id}" was not found.`);
    }

    // Unknown errors (network outage, FK constraint, etc.) bubble up unchanged
    // so NestJS's global exception filter can log and handle them appropriately.
    throw error;
  }
}