import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { BulkDeleteTasksDto, BulkUpdateStatusDto, BulkAssignDto } from './dto/bulk-tasks.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, type CurrentUserData } from '../auth/decorators/current-user.decorator';
import type { Response } from 'express';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() user: CurrentUserData) {
    return this.tasksService.create(createTaskDto, user);
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Bulk soft-delete tasks' })
  @ApiResponse({ status: 200, description: 'Tasks deleted successfully' })
  bulkDelete(@Body() dto: BulkDeleteTasksDto, @CurrentUser() user: CurrentUserData) {
    return this.tasksService.bulkRemove(dto.ids, user);
  }

  @Post('bulk-status')
  @ApiOperation({ summary: 'Bulk update task statuses' })
  @ApiResponse({ status: 200, description: 'Task statuses updated successfully' })
  bulkUpdateStatus(@Body() dto: BulkUpdateStatusDto, @CurrentUser() user: CurrentUserData) {
    return this.tasksService.bulkUpdateStatus(dto.ids, dto.status, user);
  }

  @Post('bulk-assign')
  @ApiOperation({ summary: 'Bulk assign tasks to users' })
  @ApiResponse({ status: 200, description: 'Tasks assigned successfully' })
  bulkAssign(@Body() dto: BulkAssignDto, @CurrentUser() user: CurrentUserData) {
    return this.tasksService.bulkAssign(dto.ids, dto.assignedToIds, user);
  }

  @Get('board')
  @ApiOperation({ summary: 'Get tasks grouped by status for Kanban board' })
  @ApiResponse({ status: 200, description: 'Tasks grouped by status' })
  getBoard(@CurrentUser() user: CurrentUserData) {
    return this.tasksService.findAllGroupedByStatus(user);
  }
  @Get('export/pdf')
  @ApiOperation({ summary: 'Export tasks as PDF' })
  @ApiResponse({ status: 200, description: 'PDF file' })
  async exportPDF(@Query() query: QueryTasksDto, @CurrentUser() user: CurrentUserData, @Res() res) {
    const pdf = await this.tasksService.exportPDF(query, user);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="tasks.pdf"');
    res.send(pdf);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export tasks as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file' })
  async exportCSV(@Query() query: QueryTasksDto, @CurrentUser() user: CurrentUserData, @Res() res) {
    const csv = await this.tasksService.exportCSV(query, user);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tasks.csv"');
    res.send(csv);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks with filters' })
  @ApiResponse({ status: 200, description: 'List of tasks' })
  findAll(@Query() query: QueryTasksDto, @CurrentUser() user: CurrentUserData) {
    return this.tasksService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiResponse({ status: 200, description: 'Task details' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update task status (Kanban drag & drop)' })
  @ApiResponse({ status: 200, description: 'Task status updated' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tasksService.updateStatus(id, dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @CurrentUser() user: CurrentUserData) {
    return this.tasksService.update(id, updateTaskDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete task' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.tasksService.remove(id, user);
  }

  @Post(':id/dependencies/:dependsOnId')
  @ApiOperation({ summary: 'Add a dependency to a task (blocks/blockedBy)' })
  @ApiResponse({ status: 200, description: 'Dependency added successfully' })
  addDependency(
    @Param('id') id: string,
    @Param('dependsOnId') dependsOnId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tasksService.addDependency(id, dependsOnId, user);
  }

  @Delete(':id/dependencies/:dependsOnId')
  @ApiOperation({ summary: 'Remove a dependency from a task' })
  @ApiResponse({ status: 200, description: 'Dependency removed successfully' })
  removeDependency(
    @Param('id') id: string,
    @Param('dependsOnId') dependsOnId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tasksService.removeDependency(id, dependsOnId, user);
  }
}
