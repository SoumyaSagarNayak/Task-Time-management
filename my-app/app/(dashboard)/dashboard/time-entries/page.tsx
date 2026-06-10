"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { useAuth, useUser } from "@clerk/nextjs";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Calendar, Clock, X, Check } from "lucide-react";
import type { TimeEntry, CreateTimeEntryDto, Task } from "@/lib/types";
import { formatDateTime, formatHours } from "@/lib/utils";

const MAX_ENTRY_HOURS = 24;

const timeEntrySchema = z
  .object({
    taskIds: z.array(z.string()).optional(),
    date: z.string().min(1, "Date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    hours: z
      .number()
      .positive("Hours must be greater than 0")
      .max(
        MAX_ENTRY_HOURS,
        `Maximum ${MAX_ENTRY_HOURS} hours allowed per entry`,
      ),
    description: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(`${data.date}T${data.startTime}:00`);
    const end = new Date(`${data.date}T${data.endTime}:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startTime"],
        message: "Invalid date or time format",
      });
      return;
    }

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "End time must be after start time",
      });
      return;
    }

    const calculatedHours =
      (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (calculatedHours > MAX_ENTRY_HOURS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hours"],
        message: `Maximum ${MAX_ENTRY_HOURS} hours allowed per entry`,
      });
    }
  });

type TimeEntryFormData = z.infer<typeof timeEntrySchema>;

export default function TimeEntriesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { data: currentUser, isLoading: loadingCurrentUser } = useQuery<{
    id: string;
    role: "ADMIN" | "MEMBER";
  }>({
    queryKey: ["current-user"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error("No authentication token available");
      }
      try {
        const response = await api.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
      } catch (err: any) {
        console.error("Failed to fetch current user:", err);
        throw err;
      }
    },
    enabled: userLoaded && !!user,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const isUpdatingFromHours = React.useRef(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFilter(e.target.value);
    setPage(1);
  };

  const form = useForm<TimeEntryFormData>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      taskIds: [],
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "09:00",
      endTime: "13:00",
      hours: 4,
      description: "",
    },
  });

  const { data: timeEntries, isLoading } = useQuery<TimeEntry[]>({
    queryKey: [
      "time-entries",
      dateFilter,
      page,
      limit,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateFilter) {
        const startDate = new Date(dateFilter);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateFilter);
        endDate.setHours(23, 59, 59, 999);
        params.append("startDate", startDate.toISOString());
        params.append("endDate", endDate.toISOString());
      }
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      const token = await getToken();
      const response = await api.get(`/time-entries?${params.toString()}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      return response.data.data;
    },
    enabled: !!user && userLoaded,
    refetchInterval: 5000,
  });

  const watchStartTime = form.watch("startTime");
  const watchEndTime = form.watch("endTime");
  const watchHours = form.watch("hours");
  const watchDate = form.watch("date");

  React.useEffect(() => {
    if (isUpdatingFromHours.current) {
      isUpdatingFromHours.current = false;
      return;
    }

    if (watchStartTime && watchEndTime) {
      const [startHour, startMin] = watchStartTime.split(":").map(Number);
      const [endHour, endMin] = watchEndTime.split(":").map(Number);
      let hours = (endHour * 60 + endMin - (startHour * 60 + startMin)) / 60;

      if (hours <= 0) {
        hours += 24;
      }

      if (hours > 0) {
        const cappedHours = Math.min(hours, MAX_ENTRY_HOURS);
        form.setValue("hours", Number(cappedHours.toFixed(2)), {
          shouldValidate: false,
        });
      }
    }
  }, [watchStartTime, watchEndTime, watchDate, form]);

  React.useEffect(() => {
    if (watchStartTime && watchHours && watchHours > 0 && watchDate) {
      const cappedHours = Math.min(watchHours, MAX_ENTRY_HOURS);
      const startDate = new Date(`${watchDate}T${watchStartTime}:00`);
      const newEndTime = new Date(
        startDate.getTime() + cappedHours * 60 * 60 * 1000,
      );
      const newEndTimeStr = `${String(newEndTime.getHours()).padStart(2, "0")}:${String(newEndTime.getMinutes()).padStart(2, "0")}`;

      const currentEndTime = form.getValues("endTime");
      if (currentEndTime !== newEndTimeStr) {
        isUpdatingFromHours.current = true;
        form.setValue("endTime", newEndTimeStr, { shouldValidate: false });
        if (watchHours !== cappedHours) {
          form.setValue("hours", cappedHours, { shouldValidate: false });
        }
      }
    }
  }, [watchHours, watchStartTime, watchDate, form]);

  React.useEffect(() => {
    if (isCreateOpen && timeEntries && timeEntries.length > 0) {
      const lastEntry = timeEntries[0];
      const lastEndTime = new Date(lastEntry.endTime);
      const lastHours = lastEntry.hours;

      const lastDate = format(lastEndTime, "yyyy-MM-dd");
      const newStartTime = format(lastEndTime, "HH:mm");
      const cappedHours = Math.min(lastHours, MAX_ENTRY_HOURS);
      const newEndTime = new Date(
        lastEndTime.getTime() + cappedHours * 60 * 60 * 1000,
      );
      const newEndTimeStr = format(newEndTime, "HH:mm");

      form.setValue("date", lastDate);
      form.setValue("startTime", newStartTime);
      form.setValue("endTime", newEndTimeStr);
      form.setValue("hours", cappedHours);
    }
  }, [isCreateOpen, timeEntries, form]);

  const { data: tasks } = useQuery<Task[]>({
    queryKey: ["tasks-list"],
    queryFn: async () => {
      const token = await getToken();
      const response = await api.get(`/tasks?page=1&limit=500`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      return response.data;
    },
  });

  const getApiErrorMessage = (error: unknown) => {
    const message =
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      typeof (error as { response?: unknown }).response === "object" &&
      (error as { response?: { data?: { message?: unknown } } }).response?.data
        ? (error as { response?: { data?: { message?: unknown } } }).response
            ?.data?.message
        : undefined;
    if (Array.isArray(message)) {
      return message.join(", ");
    }
    if (typeof message === "string") {
      return message;
    }
    return "Unable to save time entry. Please check your input and try again.";
  };

  const getOverlappingEntry = (start: Date, end: Date) => {
    const entries = timeEntries || [];
    return entries.find((entry) => {
      const entryOwnerId = (entry as any).user?.id || (entry as any).userId;
      if (currentUser?.id && entryOwnerId !== currentUser.id) {
        return false;
      }
      const existingStart = new Date(entry.startTime);
      const existingEnd = new Date(entry.endTime);
      return existingStart < end && existingEnd > start;
    });
  };

  const createMutation = useMutation({
    mutationFn: async (data: TimeEntryFormData) => {
      const startDateTime = new Date(`${data.date}T${data.startTime}:00`);
      const endDateTime = new Date(`${data.date}T${data.endTime}:00`);

      const payload: CreateTimeEntryDto = {
        taskIds:
          data.taskIds && data.taskIds.length > 0 ? data.taskIds : undefined,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        hours: data.hours,
        description: data.description,
      };

      const token = await getToken();
      return api.post("/time-entries", payload, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      queryClient.invalidateQueries({ queryKey: ["time-summary"] });
      setIsCreateOpen(false);
      form.reset({
        taskIds: [],
        date: format(new Date(), "yyyy-MM-dd"),
        startTime: "09:00",
        endTime: "13:00",
        hours: 4,
        description: "",
      });
    },
    onError: (error: unknown) => {
      form.setError("root.serverError", {
        type: "server",
        message: getApiErrorMessage(error),
      });
    },
  });

  const onSubmit = (data: TimeEntryFormData) => {
    form.clearErrors("root.serverError");

    const startDateTime = new Date(`${data.date}T${data.startTime}:00`);
    const endDateTime = new Date(`${data.date}T${data.endTime}:00`);
    if (
      Number.isNaN(startDateTime.getTime()) ||
      Number.isNaN(endDateTime.getTime())
    ) {
      form.setError("startTime", {
        type: "manual",
        message: "Invalid date/time selected",
      });
      return;
    }

    if (endDateTime <= startDateTime) {
      form.setError("endTime", {
        type: "manual",
        message: "End time must be after start time",
      });
      return;
    }

    const durationHours =
      (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
    if (durationHours > MAX_ENTRY_HOURS) {
      form.setError("hours", {
        type: "manual",
        message: `Maximum ${MAX_ENTRY_HOURS} hours allowed per entry`,
      });
      return;
    }

    const overlappingEntry = getOverlappingEntry(startDateTime, endDateTime);
    if (overlappingEntry) {
      form.setError("root.serverError", {
        type: "manual",
        message: `This time range overlaps with an existing entry (${formatDateTime(overlappingEntry.startTime)} to ${formatDateTime(overlappingEntry.endTime)}).`,
      });
      return;
    }

    createMutation.mutate(data);
  };

  const onError = (errors: any) => {
    const errorDetails = Object.keys(errors).map(key => `${key}: ${errors[key]?.message}`);
    console.error("Form validation errors:", errorDetails);
  };

  const totalHours =
    timeEntries?.reduce((sum, entry) => sum + entry.hours, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Time Entries</h1>
          <p className="text-gray-500">Track your work hours</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const token = await getToken();
              const params = new URLSearchParams();
              if (dateFilter) {
                const startDate = new Date(dateFilter);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(dateFilter);
                endDate.setHours(23, 59, 59, 999);
                params.append("startDate", startDate.toISOString());
                params.append("endDate", endDate.toISOString());
              }
              const url = `/time-entries/export/csv?${params}`;
              const res = await api.get(url, {
                responseType: "blob",
                headers: {
                  Authorization: token ? `Bearer ${token}` : undefined,
                },
              });
              const blob = new Blob([res.data], { type: "text/csv" });
              const link = document.createElement("a");
              link.href = window.URL.createObjectURL(blob);
              link.download = "time-entries.csv";
              link.click();
            }}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const token = await getToken();
              const params = new URLSearchParams();
              if (dateFilter) {
                const startDate = new Date(dateFilter);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(dateFilter);
                endDate.setHours(23, 59, 59, 999);
                params.append("startDate", startDate.toISOString());
                params.append("endDate", endDate.toISOString());
              }
              const url = `/time-entries/export/pdf?${params}`;
              const res = await api.get(url, {
                responseType: "blob",
                headers: {
                  Authorization: token ? `Bearer ${token}` : undefined,
                },
              });
              const blob = new Blob([res.data], { type: "application/pdf" });
              const link = document.createElement("a");
              link.href = window.URL.createObjectURL(blob);
              link.download = "time-entries.pdf";
              link.click();
            }}
          >
            Export PDF
          </Button>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Log Time
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Log Time Entry</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit, onError)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="taskIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tasks (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                {field.value && field.value.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {field.value.map((taskId) => {
                                      const task = tasks?.find(
                                        (t) => t.id === taskId,
                                      );
                                      return task ? (
                                        <Badge
                                          key={taskId}
                                          variant="secondary"
                                          className="mr-1"
                                        >
                                          {task.title}
                                        </Badge>
                                      ) : null;
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">
                                    Select tasks
                                  </span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <div className="max-h-60 overflow-auto p-2">
                              {tasks && tasks.length > 0 ? (
                                <div className="space-y-2">
                                  {tasks.map((task) => {
                                    const isSelected = field.value?.includes(
                                      task.id,
                                    );
                                    return (
                                      <div
                                        key={task.id}
                                        className="flex items-center space-x-2 cursor-pointer rounded-md p-2 hover:bg-accent"
                                        onClick={() => {
                                          const currentValue =
                                            field.value || [];
                                          if (isSelected) {
                                            field.onChange(
                                              currentValue.filter(
                                                (id) => id !== task.id,
                                              ),
                                            );
                                          } else {
                                            field.onChange([
                                              ...currentValue,
                                              task.id,
                                            ]);
                                          }
                                        }}
                                      >
                                        <div
                                          className={`flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${
                                            isSelected
                                              ? "bg-primary text-primary-foreground"
                                              : "bg-background"
                                          }`}
                                        >
                                          {isSelected && (
                                            <Check className="h-3 w-3" />
                                          )}
                                        </div>
                                        <label className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                          {task.title}
                                        </label>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground p-2">
                                  No tasks available
                                </p>
                              )}
                            </div>
                            {field.value && field.value.length > 0 && (
                              <div className="border-t p-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => field.onChange([])}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Clear all
                                </Button>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Select one or more tasks to link this time entry to
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hours</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.25"
                              min="0.25"
                              max={MAX_ENTRY_HOURS}
                              {...field}
                              onChange={(e) => {
                                const raw = e.target.valueAsNumber;
                                if (Number.isNaN(raw)) {
                                  field.onChange(
                                    undefined as unknown as number,
                                  );
                                  return;
                                }
                                const clamped = Math.min(
                                  Math.max(raw, 0.25),
                                  MAX_ENTRY_HOURS,
                                );
                                field.onChange(clamped);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What did you work on?"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.formState.errors.root?.serverError?.message && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {form.formState.errors.root.serverError.message}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Saving..." : "Log Time"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHours(totalHours)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entries</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {timeEntries?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List Card */}
      <Card>
        <CardHeader>
          <CardTitle>My Time Log</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading time entries...</p>
          ) : !timeEntries || timeEntries.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No time entries found for the selected period.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {formatDateTime(entry.startTime)}
                    </TableCell>
                    <TableCell>
                      {entry.tasks && entry.tasks.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {entry.tasks.map((task) => (
                            <span key={task.id} className="text-sm">
                              {task.title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          General
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm line-clamp-2">
                        {entry.description}
                      </p>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatHours(entry.hours)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Date Filter */}
      <div className="flex gap-2">
        <Input
          type="date"
          value={dateFilter}
          onChange={handleDateFilterChange}
          className="w-64"
          placeholder="Filter by date"
        />
        {dateFilter && (
          <Button variant="outline" onClick={() => setDateFilter("")}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
