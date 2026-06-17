import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';

/**
 * UpdateTaskDto — the validated shape of a PATCH /tasks/:id request body.
 *
 * PartialType(CreateTaskDto) does three things in one line:
 *
 *   1. Marks every field @IsOptional() — the client sends only the delta
 *      (e.g. `{ "status": "IN_PROGRESS" }` on a drag-and-drop column change).
 *
 *   2. Inherits every class-validator decorator from CreateTaskDto, so
 *      @MaxLength, @IsIn, and @IsUUID rules are never duplicated.
 *
 *   3. Stays in sync automatically — adding a new field to CreateTaskDto
 *      propagates here for free. There is nothing to forget.
 *
 * This is the canonical NestJS PATCH pattern. Using PUT here would require
 * the client to send the full resource representation on every column move —
 * expensive and fragile on a real-time drag-and-drop board.
 */
export class UpdateTaskDto extends PartialType(CreateTaskDto) {}