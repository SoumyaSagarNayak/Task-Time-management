import PDFDocument from 'pdfkit';
import { Parser as Json2CsvParser } from 'json2csv';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';
import { QueryTimeEntriesDto } from './dto/query-time-entries.dto';
import { ExportTimeEntriesDto, ExportFormat } from './dto/export-time-entries.dto';
import { CurrentUserData } from '../auth/decorators/current-user.decorator';

@Injectable()
export class TimeEntriesService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
  ) { }

  private validateTimeRange(start: Date, end: Date) {
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid start or end time format');
    }

    if (end <= start) {
      throw new BadRequestException('End time must be after start time');
    }
  }

  private validateMaxHours(hours: number) {
    if (hours <= 0) {
      throw new BadRequestException('Hours must be greater than 0');
    }

    if (hours > 24) {
      throw new BadRequestException('Maximum 24 hours allowed per entry');
    }
  }

  private formatOverlapRange(start: Date, end: Date) {
    const date = start.toISOString().slice(0, 10);
    const startTime = start.toISOString().slice(11, 16);
    const endTime = end.toISOString().slice(11, 16);
    return `${date} ${startTime}-${endTime}`;
  }

  private async ensureNoOverlap(
    userId: string,
    start: Date,
    end: Date,
    excludeId?: string,
  ) {
    const overlappingEntry = await this.prisma.timeEntry.findFirst({
      where: {
        userId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        startTime: { lt: end },
        endTime: { gt: start },
      },
      orderBy: { startTime: 'asc' },
    });

    if (overlappingEntry) {
      const conflictRange = this.formatOverlapRange(
        overlappingEntry.startTime,
        overlappingEntry.endTime,
      );
      throw new BadRequestException(
        `This time entry overlaps with an existing entry (${conflictRange}). Please adjust the time range.`,
      );
    }
  }

  async exportCSV(query, user) {
    //[TO BE IMPLEMENTED]
  }

  async exportPDF(query, user){
    //[TO BE IMPLEMENTED]
  }

  async create(createTimeEntryDto: CreateTimeEntryDto, user: CurrentUserData) {
    const {
      taskIds,
      taskId,
      startedAt,
      stoppedAt,
      durationSeconds,
      ...entryData
    } = createTimeEntryDto;

    const finalStartTime = startedAt || entryData.startTime;
    const finalEndTime = stoppedAt || entryData.endTime;

    if (!finalStartTime || !finalEndTime) {
      throw new BadRequestException('Start time and end time are required');
    }

    // Validate time range
    const start = new Date(finalStartTime);
    const end = new Date(finalEndTime);
    this.validateTimeRange(start, end);

    let finalHours = durationSeconds ? durationSeconds / 3600 : entryData.hours;
    if (finalHours === undefined) {
      finalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }

    this.validateMaxHours(finalHours);

    let userId: string;

    // Members can only create entries for themselves
    if (user.role === 'MEMBER') {
      if (createTimeEntryDto.userId && createTimeEntryDto.userId !== user.id) {
        throw new ForbiddenException(
          'You can only create time entries for yourself',
        );
      }
      userId = user.id;
    } else {
      userId = createTimeEntryDto.userId || user.id;
    }

    // Prevent overlapping entries for the same user
    const overlappingEntry = await this.prisma.timeEntry.findFirst({
      where: {
        userId,
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (overlappingEntry) {
      throw new BadRequestException(
        'This time entry overlaps with an existing entry. Please adjust the start or end time.',
      );
    }

    // Validate tasks if provided
    const allTaskIds = [...(taskIds || [])];
    if (taskId && !allTaskIds.includes(taskId)) {
      allTaskIds.push(taskId);
    }

    if (allTaskIds.length > 0) {
      const tasks = await this.prisma.task.findMany({
        where: {
          id: { in: allTaskIds },
          isActive: true,
        },
      });

      if (tasks.length !== allTaskIds.length) {
        throw new BadRequestException(
          'One or more tasks not found',
        );
      }
    }

    // Final validation for time range, duration, and overlaps
    const { hours: validatedHours } = await this.validateTimeEntry(
      userId,
      finalStartTime,
      finalEndTime,
    );

    // If hours wasn't provided, use validated hours
    if (finalHours === undefined) {
      finalHours = validatedHours;
    }

    await this.ensureNoOverlap(userId, start, end);

    const createdEntry = await this.prisma.timeEntry.create({
      data: {
        userId,
        startTime: new Date(finalStartTime),
        endTime: new Date(finalEndTime),
        hours: finalHours,
        description: entryData.description,
        isBillable: entryData.isBillable || false,
        ...(allTaskIds.length > 0 && {
          tasks: {
            connect: allTaskIds.map((id) => ({ id })),
          },
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return createdEntry;
  }

  async findAll(query: QueryTimeEntriesDto, user: CurrentUserData) {
    const { userId, taskId, startDate, endDate, page = 1, limit = 10 } = query;

    const where: any = {};

    if (user.role === 'MEMBER') {
      where.userId = user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (taskId) {
      where.tasks = {
        some: {
          id: taskId,
        },
      };
    }
    if (startDate) {
      where.startTime = {
        gte: new Date(startDate),
      };
    }
    if (endDate) {
      where.endTime = {
        lte: new Date(endDate),
      };
    }

    const [total, data] = await Promise.all([
      this.prisma.timeEntry.count({ where }),
      this.prisma.timeEntry.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          tasks: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
        orderBy: { startTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  generateCSV(entries: any[]) {
    const header = [
      'ID',
      'User',
      'Tasks',
      'Start Time',
      'End Time',
      'Hours',
      'Billable',
      'Description',
    ];
    const rows = entries.map((e) => {
      const user = e.user ? `${e.user.firstName || ''} ${e.user.lastName || ''}`.trim() : '';
      const tasks = (e.tasks || []).map((t) => t.title).join('; ');
      return [
        e.id,
        user,
        tasks,
        new Date(e.startTime).toISOString(),
        new Date(e.endTime).toISOString(),
        e.hours,
        e.isBillable ? 'Yes' : 'No',
        e.description || '',
      ]
        .map((col) => {
          const str = String(col).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',');
    });
    return [header.join(','), ...rows].join('\r\n');
  }

  async generatePDF(entries: any[]): Promise<Buffer> {
    const PDFDocument = require('pdfkit');
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ autoFirstPage: false, margin: 40 });
      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      doc.addPage();
      doc.fontSize(16).text('Time Entries Report', { align: 'center' });
      doc.moveDown(1);

      const header = [
        'ID',
        'User',
        'Tasks',
        'Start',
        'End',
        'Hours',
        'Billable',
        'Description',
      ];
      doc.font('Helvetica-Bold').fontSize(10);
      header.forEach((h, i) => {
        doc.text(h, { continued: i !== header.length - 1, width: 100 });
      });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(9);

      for (const e of entries) {
        const user = e.user ? `${e.user.firstName || ''} ${e.user.lastName || ''}`.trim() : '';
        const tasks = (e.tasks || []).map((t) => t.title).join('; ');
        const row = [
          e.id,
          user,
          tasks,
          new Date(e.startTime).toISOString(),
          new Date(e.endTime).toISOString(),
          e.hours.toString(),
          e.isBillable ? 'Yes' : 'No',
          e.description || '',
        ];
        row.forEach((col, i) => {
          doc.text(String(col), { continued: i !== row.length - 1, width: 100 });
        });
        doc.moveDown(0.5);
      }

      doc.end();
    });
  }

  async findOne(id: string, user: CurrentUserData) {
    const timeEntry = await this.prisma.timeEntry.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
          },
        },
      },
    });

    if (!timeEntry) {
      throw new NotFoundException('Time entry not found');
    }

    if (user.role === 'MEMBER' && timeEntry.userId !== user.id) {
      throw new ForbiddenException('You can only access your own time entries');
    }

    return timeEntry;
  }

  async update(
    id: string,
    updateTimeEntryDto: UpdateTimeEntryDto,
    user: CurrentUserData,
  ) {
    const timeEntry = await this.findOne(id, user);

    const { taskIds, ...entryData } = updateTimeEntryDto;

    const nextStart = entryData.startTime
      ? new Date(entryData.startTime)
      : timeEntry.startTime;
    const nextEnd = entryData.endTime
      ? new Date(entryData.endTime)
      : timeEntry.endTime;
    this.validateTimeRange(nextStart, nextEnd);

    const nextHours =
      entryData.hours ??
      (nextEnd.getTime() - nextStart.getTime()) / (1000 * 60 * 60);
    this.validateMaxHours(nextHours);

    if (user.role === 'MEMBER' && timeEntry.userId !== user.id) {
      throw new ForbiddenException('You can only update your own time entries');
    }

    await this.ensureNoOverlap(timeEntry.userId, nextStart, nextEnd, id);

    if (taskIds !== undefined && taskIds.length > 0) {
      const tasks = await this.prisma.task.findMany({
        where: {
          id: { in: taskIds },
          isActive: true,
        },
      });

      if (tasks.length !== taskIds.length) {
        throw new BadRequestException(
          'One or more tasks not found',
        );
      }
    }

    return this.prisma.timeEntry.update({
      where: { id },
      data: {
        ...entryData,
        ...(entryData.startTime !== undefined && { startTime: nextStart }),
        ...(entryData.endTime !== undefined && { endTime: nextEnd }),
        ...(entryData.hours !== undefined && { hours: nextHours }),
        ...(taskIds !== undefined && {
          tasks: {
            set:
              taskIds.length > 0
                ? taskIds.map((taskId) => ({ id: taskId }))
                : [],
          },
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });
  }

  async remove(id: string, user: CurrentUserData) {
    const timeEntry = await this.findOne(id, user);

    if (user.role === 'MEMBER' && timeEntry.userId !== user.id) {
      throw new ForbiddenException('You can only delete your own time entries');
    }

    const result = await this.prisma.timeEntry.delete({
      where: { id },
    });

    await this.activityService.log({
      userId: user.id,
      action: 'TIME_ENTRY_DELETED',
      entityType: 'TIME_ENTRY',
      entityId: id,
      metadata: { hours: timeEntry.hours },
    });

    return result;
  }

  async bulkRemove(ids: string[], user: CurrentUserData) {
    const entries = await this.prisma.timeEntry.findMany({
      where: { id: { in: ids } },
    });

    if (entries.length !== ids.length) {
      throw new NotFoundException('One or more time entries not found');
    }

    if (user.role === 'MEMBER') {
      const notOwned = entries.filter((e) => e.userId !== user.id);
      if (notOwned.length > 0) {
        throw new ForbiddenException('You can only delete your own time entries');
      }
    }

    const result = await this.prisma.timeEntry.deleteMany({
      where: { id: { in: ids } },
    });

    await this.activityService.log({
      userId: user.id,
      action: 'TIME_ENTRY_BULK_DELETED',
      entityType: 'TIME_ENTRY',
      metadata: { count: ids.length },
    });

    return result;
  }

  async getTimeSummary(query: QueryTimeEntriesDto, user: CurrentUserData) {
    const { userId, taskId, startDate, endDate } = query;

    const where: any = {};

    if (user.role === 'MEMBER') {
      where.userId = user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (taskId) {
      where.tasks = {
        some: {
          id: taskId,
        },
      };
    }
    if (startDate) {
      where.startTime = {
        gte: new Date(startDate),
      };
    }
    if (endDate) {
      where.endTime = {
        lte: new Date(endDate),
      };
    }

    const entries = await this.prisma.timeEntry.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);

    const byUser = entries.reduce((acc, entry) => {
      const key = entry.userId;
      if (!acc[key]) {
        acc[key] = {
          user: entry.user,
          totalHours: 0,
          entriesCount: 0,
        };
      }
      acc[key].totalHours += entry.hours;
      acc[key].entriesCount += 1;
      return acc;
    }, {});

    const byTask = entries.reduce((acc, entry) => {
      entry.tasks.forEach((task) => {
        const key = task.id;
        if (!acc[key]) {
          acc[key] = {
            task,
            totalHours: 0,
            entriesCount: 0,
          };
        }
        acc[key].totalHours += entry.hours;
        acc[key].entriesCount += 1;
      });
      return acc;
    }, {});

    return {
      summary: {
        totalHours,
        entriesCount: entries.length,
      },
      byUser: Object.values(byUser),
      byTask: Object.values(byTask),
    };
  }

  async exportTimeEntries(dto: ExportTimeEntriesDto, user: CurrentUserData) {
    const where = this.getWhereClause(dto, user);
    const entries = await this.prisma.timeEntry.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        tasks: { select: { id: true, title: true, status: true } },
      },
      orderBy: { startTime: 'desc' },
      take: 5000,
    });

    if (dto.format === ExportFormat.CSV) {
      return this.generateCsv(entries, dto);
    }
    return this.generatePdf(entries, dto);
  }

  private generateCsv(
    entries: any[],
    dto: ExportTimeEntriesDto,
  ): { data: string; contentType: string; filename: string } {
    const headers = [
      'Date',
      'Start Time',
      'End Time',
      'Hours',
      'Description',
      'Billable',
      'User',
      'User Email',
      'Tasks',
    ];

    const rows = entries.map((entry) => {
      const startTime = new Date(entry.startTime);
      const endTime = new Date(entry.endTime);
      const userName = [entry.user?.firstName, entry.user?.lastName]
        .filter(Boolean)
        .join(' ') || 'N/A';
      const tasks = (entry.tasks || []).map((t: any) => t.title).join('; ');

      return [
        startTime.toISOString().split('T')[0],
        startTime.toISOString(),
        endTime.toISOString(),
        entry.hours.toString(),
        `"${(entry.description || '').replace(/"/g, '""')}"`,
        entry.isBillable ? 'Yes' : 'No',
        `"${userName}"`,
        entry.user?.email || '',
        `"${tasks}"`,
      ].join(',');
    });

    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
    rows.push('');
    rows.push(`Total,,,"${totalHours}",,,,`);

    const dateRange = this.formatDateRange(dto);
    const csv = [
      `Time Entries Export${dateRange ? ' — ' + dateRange : ''}`,
      `Generated: ${new Date().toISOString()}`,
      '',
      headers.join(','),
      ...rows,
    ].join('\n');

    return {
      data: csv,
      contentType: 'text/csv',
      filename: `time-entries-${new Date().toISOString().split('T')[0]}.csv`,
    };
  }

  private async generatePdf(
    entries: any[],
    dto: ExportTimeEntriesDto,
  ): Promise<{ data: Buffer; contentType: string; filename: string }> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        resolve({
          data: Buffer.concat(chunks),
          contentType: 'application/pdf',
          filename: `time-entries-${new Date().toISOString().split('T')[0]}.pdf`,
        });
      });
      doc.on('error', reject);

      // Title
      doc.fontSize(18).font('Helvetica-Bold').text('Time Entries Report', { align: 'center' });
      doc.moveDown(0.3);

      // Date range subtitle
      const dateRange = this.formatDateRange(dto);
      if (dateRange) {
        doc.fontSize(10).font('Helvetica').text(dateRange, { align: 'center' });
      }
      doc.fontSize(8).font('Helvetica')
        .text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(1);

      // Summary
      const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
      doc.fontSize(11).font('Helvetica-Bold').text('Summary');
      doc.fontSize(10).font('Helvetica')
        .text(`Total Entries: ${entries.length}    |    Total Hours: ${totalHours.toFixed(2)}`);
      doc.moveDown(1);

      // Table header
      const colX = [40, 120, 220, 320, 380, 440, 560];
      const colHeaders = ['Date', 'Start', 'End', 'Hours', 'Billable', 'User', 'Tasks'];

      doc.fontSize(9).font('Helvetica-Bold');
      colHeaders.forEach((header, i) => {
        doc.text(header, colX[i], doc.y, { continued: i < colHeaders.length - 1, width: 100 });
      });
      doc.moveDown(0.3);

      // Divider line
      const lineY = doc.y;
      doc.moveTo(40, lineY).lineTo(770, lineY).stroke();
      doc.moveDown(0.3);

      // Table rows
      doc.font('Helvetica').fontSize(8);
      for (const entry of entries) {
        if (doc.y > 540) {
          doc.addPage();
          doc.fontSize(8).font('Helvetica');
        }

        const startTime = new Date(entry.startTime);
        const endTime = new Date(entry.endTime);
        const userName = [entry.user?.firstName, entry.user?.lastName]
          .filter(Boolean)
          .join(' ') || 'N/A';
        const tasks = (entry.tasks || []).map((t: any) => t.title).join(', ');

        const y = doc.y;
        doc.text(startTime.toISOString().split('T')[0], colX[0], y, { width: 75 });
        doc.text(startTime.toLocaleTimeString(), colX[1], y, { width: 95 });
        doc.text(endTime.toLocaleTimeString(), colX[2], y, { width: 95 });
        doc.text(entry.hours.toFixed(2), colX[3], y, { width: 55 });
        doc.text(entry.isBillable ? 'Yes' : 'No', colX[4], y, { width: 55 });
        doc.text(userName, colX[5], y, { width: 115 });
        doc.text(tasks.substring(0, 40), colX[6], y, { width: 200 });
        doc.moveDown(0.8);
      }

      // Footer total
      doc.moveDown(0.5);
      const footerY = doc.y;
      doc.moveTo(40, footerY).lineTo(770, footerY).stroke();
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica-Bold')
        .text(`Total: ${totalHours.toFixed(2)} hours across ${entries.length} entries`);

      doc.end();
    });
  }

  private formatDateRange(dto: ExportTimeEntriesDto): string {
    const parts: string[] = [];
    if (dto.startDate) parts.push(`From: ${new Date(dto.startDate).toLocaleDateString()}`);
    if (dto.endDate) parts.push(`To: ${new Date(dto.endDate).toLocaleDateString()}`);
    return parts.join('  ');
  }

  private async validateTimeEntry(
    userId: string,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Promise<{ startTime: string; endTime: string; hours: number }> {
    if (!startTime || !endTime) {
      throw new BadRequestException('Start time and end time are required');
    }

    let start = new Date(startTime);
    let end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid start or end time format');
    }

    let durationMs = end.getTime() - start.getTime();

    // Support midnight crossing if end time is before start time
    if (durationMs < 0) {
      end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
      durationMs = end.getTime() - start.getTime();

      if (durationMs <= 0) {
        throw new BadRequestException('End time must be after start time');
      }
    } else if (durationMs === 0) {
      throw new BadRequestException('End time must be after start time');
    }

    const hours = durationMs / (1000 * 60 * 60);

    if (hours > 24) {
      throw new BadRequestException('Maximum 24 hours allowed per entry');
    }

    // Overlap check
    const overlapping = await this.prisma.timeEntry.findFirst({
      where: {
        userId,
        id: excludeId ? { not: excludeId } : undefined,
        OR: [
          {
            startTime: {
              gt: start,
              lt: end,
            },
          },
          {
            endTime: {
              gt: start,
              lt: end,
            },
          },
          {
            startTime: { lte: start },
            endTime: { gte: end },
          },
        ],
      },
    });

    if (overlapping) {
      throw new BadRequestException('Time entry overlaps with an existing entry');
    }

    return {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      hours: Number(hours.toFixed(2)),
    };
  }

  private getWhereClause(query: QueryTimeEntriesDto, user: CurrentUserData) {
    const { userId, taskId, startDate, endDate } = query;
    const where: any = {};

    if (user.role === 'MEMBER') {
      where.userId = user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (taskId) {
      where.tasks = { some: { id: taskId } };
    }
    if (startDate) {
      where.startTime = { gte: new Date(startDate) };
    }
    if (endDate) {
      where.endTime = { lte: new Date(endDate) };
    }

    return where;
  }
}
