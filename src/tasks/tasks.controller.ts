
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Task } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

/**
 * TasksController — the HTTP boundary of the Kanban task domain.
 *
 * Responsibilities here are deliberately narrow:
 *   1. Declare routes and HTTP verbs.
 *   2. Extract and type-annotate inputs (body, params).
 *   3. Delegate all business logic to TasksService.
 *
 * No `if` statements, no Prisma imports, no direct database calls.
 * A controller that stays this thin is trivially unit-testable via a
 * jest.mock() of the service — no framework overhead required.
 */
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // POST /tasks
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Creates a new task card.
   * HTTP 201 Created is the semantically correct status for a newly minted
   * resource. NestJS defaults POST to 201 but @HttpCode makes the intent
   * explicit and self-documenting for future maintainers.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GET /tasks
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Returns all task cards ordered newest-first.
   * HTTP 200 OK is the NestJS default for GET — no decorator needed.
   */
  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GET /tasks/:id
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Returns a single task by its UUID, including its assignee and comments.
   *
   * ParseUUIDPipe (version: '4') rejects the request with HTTP 400 before
   * it ever reaches the service if `:id` is not a valid v4 UUID — catching
   * obviously invalid IDs at the routing layer rather than wasting a DB call.
   */
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.tasksService.findOne(id);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PATCH /tasks/:id
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Applies a partial update — only the fields present in the request body
   * are mutated. PATCH (not PUT) is correct here: the client sends a delta
   * (e.g. `{ "status": "IN_PROGRESS" }`) on a card drag-and-drop, never the
   * full resource representation.
   */
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, updateTaskDto);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE /tasks/:id
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Deletes the task and returns the deleted record (HTTP 200 with body).
   * HTTP 204 No Content would discard the response body — we deliberately
   * return 200 so clients receive the exact deleted state for audit logs
   * and optimistic-UI rollback if a concurrent user was viewing the card.
   */
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.tasksService.remove(id);
  }
}