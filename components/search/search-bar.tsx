'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Search as SearchIcon, X, Loader2, FileText, Clock, MessageSquare, SlidersHorizontal } from 'lucide-react';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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
  };
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export function SearchBar() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | 'task' | 'time_entry' | 'comment'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  const fetchResults = useCallback(async () => {
    if (debouncedQuery.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      params.set('q', debouncedQuery.trim());
      if (type !== 'all') params.set('type', type);
      if (startDate) params.set('startDate', new Date(startDate).toISOString());
      if (endDate) params.set('endDate', new Date(endDate + 'T23:59:59').toISOString());
      params.set('limit', '15');
      const res = await api.get<{ results: SearchResultItem[] }>(`/search?${params}`, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
      });
      setResults(res.data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, type, startDate, endDate, getToken]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: SearchResultItem) => {
    setOpen(false);
    setQuery('');
    if (item.type === 'task') {
      router.push('/dashboard/tasks');
    } else if (item.type === 'time_entry') {
      router.push('/dashboard/time-entries');
    } else if (item.type === 'comment' && item.metadata.taskId) {
      router.push('/dashboard/tasks');
    } else {
      router.push('/dashboard/tasks');
    }
  };

  const typeIcon = (t: SearchResultItem['type']) => {
    switch (t) {
      case 'task':
        return <FileText className="h-3.5 w-3.5 text-blue-600" />;
      case 'time_entry':
        return <Clock className="h-3.5 w-3.5 text-amber-600" />;
      case 'comment':
        return <MessageSquare className="h-3.5 w-3.5 text-violet-600" />;
    }
  };

  const typeLabel = (t: SearchResultItem['type']) => {
    switch (t) {
      case 'task':
        return 'Task';
      case 'time_entry':
        return 'Time entry';
      case 'comment':
        return 'Comment';
    }
  };

  const hasActiveFilters = type !== 'all' || startDate || endDate;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1 min-w-0">
          <SearchIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground shrink-0" />
          <Input
            type="search"
            placeholder="Search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="h-9 pl-8 pr-8 text-sm"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-9 w-8 shrink-0"
              onClick={() => setQuery('')}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="relative h-9 w-9 shrink-0"
              title="Search filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {hasActiveFilters && (
                <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="end">
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Filter results</p>
              <div>
                <label className="mb-1 block text-xs font-medium">Type</label>
                <Select value={type} onValueChange={(v: typeof type) => setType(v)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="task">Tasks</SelectItem>
                    <SelectItem value="time_entry">Time entries</SelectItem>
                    <SelectItem value="comment">Comments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium">From</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">To</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-full text-xs"
                  onClick={() => {
                    setType('all');
                    setStartDate('');
                    setEndDate('');
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {open && (query.length >= 2 || results.length > 0) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[320px] overflow-auto rounded-lg border bg-popover shadow-md">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {debouncedQuery.trim().length < 2
                ? 'Type at least 2 characters'
                : 'No results found'}
            </div>
          ) : (
            <ul className="py-1">
              {results.map((item) => (
                <li key={`${item.type}-${item.id}`}>
                  <button
                    type="button"
                    className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-accent"
                    onClick={() => handleSelect(item)}
                  >
                    <div className="flex items-center gap-2">
                      {typeIcon(item.type)}
                      <span className="text-xs font-medium text-muted-foreground">
                        {typeLabel(item.type)}
                      </span>
                      {item.type === 'comment' && item.metadata.taskTitle && (
                        <span className="truncate text-xs text-muted-foreground">
                          · {item.metadata.taskTitle}
                        </span>
                      )}
                    </div>
                    <span className="font-medium">{item.title}</span>
                    {item.snippet && (
                      <span
                        className="line-clamp-2 text-sm text-muted-foreground [&_mark]:bg-yellow-200 [&_mark]:font-medium [&_mark]:text-foreground"
                        dangerouslySetInnerHTML={{ __html: item.snippet }}
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
