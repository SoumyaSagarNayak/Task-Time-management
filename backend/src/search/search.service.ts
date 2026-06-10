import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserData } from '../auth/decorators/current-user.decorator';
import { SearchQueryDto } from './dto/search-query.dto';

export interface SearchResultItem {
  type: 'task' | 'time_entry' | 'comment';
  id: string;
  title: string;
  snippet: string;
  rank: number;
  metadata: {
    taskId?: string;
    taskTitle?: string;
    startTime?: string;
    createdAt?: string;
    [key: string]: unknown;
  };
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(
    dto: SearchQueryDto,
    user: CurrentUserData,
  ): Promise<{ results: SearchResultItem[] }> {
    const q = (dto.q ?? '').trim();
    if (q.length < 2) {
      return { results: [] };
    }

    const type = dto.type ?? 'all';
    const limit = Math.min(Math.max(Number(dto.limit) || 20, 1), 50);
    const startDate = dto.startDate ? new Date(dto.startDate) : null;
    const endDate = dto.endDate ? new Date(dto.endDate) : null;

    const isMember = user.role === 'MEMBER';
    const memberUserId = isMember ? user.id : null;

    const results: SearchResultItem[] = [];

    if (type === 'all' || type === 'task') {
      results.push(...await this.searchTasks(q, limit, memberUserId, startDate, endDate));
    }
    if (type === 'all' || type === 'time_entry') {
      results.push(...await this.searchTimeEntries(q, limit, memberUserId, startDate, endDate));
    }
    if (type === 'all' || type === 'comment') {
      results.push(...await this.searchComments(q, limit, memberUserId, startDate, endDate));
    }

    results.sort((a, b) => b.rank - a.rank);
    return { results: results.slice(0, limit) };
  }

  private async searchTasks(
    q: string,
    limit: number,
    memberUserId: string | null,
    startDate: Date | null,
    endDate: Date | null,
  ): Promise<SearchResultItem[]> {
    const conditions: string[] = [
      't.is_active = true',
      "t.search_vector @@ plainto_tsquery('english', $1)",
    ];
    const params: (string | number | Date)[] = [q, q];
    let n = 3;
    if (memberUserId) {
      conditions.push(`EXISTS (SELECT 1 FROM "_AssignedTasks" at WHERE at."A" = t.id AND at."B" = $${n++})`);
      params.push(memberUserId);
    }
    if (startDate) {
      conditions.push(`t.created_at >= $${n++}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`t.created_at <= $${n++}`);
      params.push(endDate);
    }
    params.push(limit);
    const limitParam = n;

    const sql = `
      SELECT t.id, t.title,
        ts_headline('english', coalesce(t.title, '') || ' ' || coalesce(t.description, ''), plainto_tsquery('english', $1), 'StartSel=<mark>,StopSel=</mark>,MaxWords=35,MinWords=15') AS snippet,
        ts_rank(t.search_vector, plainto_tsquery('english', $2))::float AS rank,
        t.created_at
      FROM tasks t
      WHERE ${conditions.join(' AND ')}
      ORDER BY rank DESC
      LIMIT $${limitParam}
    `;
    const rows = await this.prisma.$queryRawUnsafe<
      { id: string; title: string; snippet: string; rank: number; created_at: Date }[]
    >(sql, ...params);
    return (rows ?? []).map((r) => ({
      type: 'task' as const,
      id: r.id,
      title: r.title,
      snippet: r.snippet ?? '',
      rank: Number(r.rank),
      metadata: { createdAt: r.created_at?.toISOString?.() },
    }));
  }

  private async searchTimeEntries(
    q: string,
    limit: number,
    memberUserId: string | null,
    startDate: Date | null,
    endDate: Date | null,
  ): Promise<SearchResultItem[]> {
    const conditions: string[] = [
      "te.search_vector @@ plainto_tsquery('english', $1)",
    ];
    const params: (string | number | Date)[] = [q, q];
    let n = 3;
    if (memberUserId) {
      conditions.push(`te.user_id = $${n++}`);
      params.push(memberUserId);
    }
    if (startDate) {
      conditions.push(`te.start_time >= $${n++}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`te.end_time <= $${n++}`);
      params.push(endDate);
    }
    params.push(limit);
    const limitParam = n;

    const sql = `
      SELECT te.id, coalesce(te.description, 'Time entry') AS title,
        ts_headline('english', coalesce(te.description, ''), plainto_tsquery('english', $1), 'StartSel=<mark>,StopSel=</mark>,MaxWords=35,MinWords=15') AS snippet,
        ts_rank(te.search_vector, plainto_tsquery('english', $2))::float AS rank,
        te.start_time
      FROM time_entries te
      WHERE ${conditions.join(' AND ')}
      ORDER BY rank DESC
      LIMIT $${limitParam}
    `;
    const rows = await this.prisma.$queryRawUnsafe<
      { id: string; title: string; snippet: string; rank: number; start_time: Date }[]
    >(sql, ...params);
    return (rows ?? []).map((r) => ({
      type: 'time_entry' as const,
      id: r.id,
      title: r.title ?? 'Time entry',
      snippet: r.snippet ?? '',
      rank: Number(r.rank),
      metadata: { startTime: r.start_time?.toISOString?.() },
    }));
  }

  private async searchComments(
    q: string,
    limit: number,
    memberUserId: string | null,
    startDate: Date | null,
    endDate: Date | null,
  ): Promise<SearchResultItem[]> {
    const conditions: string[] = [
      "c.search_vector @@ plainto_tsquery('english', $1)",
    ];
    const params: (string | number | Date)[] = [q, q];
    let n = 3;
    if (memberUserId) {
      conditions.push(`EXISTS (SELECT 1 FROM "_AssignedTasks" at WHERE at."A" = t.id AND at."B" = $${n++})`);
      params.push(memberUserId);
    }
    if (startDate) {
      conditions.push(`c.created_at >= $${n++}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`c.created_at <= $${n++}`);
      params.push(endDate);
    }
    params.push(limit);
    const limitParam = n;

    const sql = `
      SELECT c.id, left(c.body, 80) AS title,
        ts_headline('english', c.body, plainto_tsquery('english', $1), 'StartSel=<mark>,StopSel=</mark>,MaxWords=35,MinWords=15') AS snippet,
        ts_rank(c.search_vector, plainto_tsquery('english', $2))::float AS rank,
        c.created_at, c.task_id, t.title AS task_title
      FROM comments c
      JOIN tasks t ON t.id = c.task_id AND t.is_active = true
      WHERE ${conditions.join(' AND ')}
      ORDER BY rank DESC
      LIMIT $${limitParam}
    `;
    const rows = await this.prisma.$queryRawUnsafe<
      { id: string; title: string; snippet: string; rank: number; created_at: Date; task_id: string; task_title: string }[]
    >(sql, ...params);
    return (rows ?? []).map((r) => ({
      type: 'comment' as const,
      id: r.id,
      title: r.title ?? 'Comment',
      snippet: r.snippet ?? '',
      rank: Number(r.rank),
      metadata: {
        taskId: r.task_id,
        taskTitle: r.task_title,
        createdAt: r.created_at?.toISOString?.(),
      },
    }));
  }
}
