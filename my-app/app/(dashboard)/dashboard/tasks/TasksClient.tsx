"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import type {
  Task,
  TaskStatus,
  User as UserType,
} from "@/lib/types";
import { TaskStatus as TaskStatusEnum } from "@/lib/types";
import { TaskList } from "./components/TaskList";
import { FilterBar } from "./components/FilterBar";
import { TaskForm, TaskFormData } from "./components/TaskForm";
import { useFilterParams } from "./hooks/useFilterParams";
import { useDebounce } from "@/hooks/useDebounce";

interface CurrentUser {
  id: string;
  role: "ADMIN" | "MEMBER";
}

export function TasksClient() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "kanban">("kanban");
  const queryClient = useQueryClient();

  const { getParam, setParams } = useFilterParams();

  // Filter State
  const [searchQuery, setSearchQuery] = useState<string>(
    getParam("search", ""),
  );
  const [priorityFilter, setPriorityFilter] = useState<string>(
    getParam("priority", "all"),
  );
  const [assigneeFilter, setAssigneeFilter] = useState<string>(
    getParam("assignee", "all"),
  );

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Sync state to URL
  useEffect(() => {
    setParams({
      search: debouncedSearchQuery,
      priority: priorityFilter,
      assignee: assigneeFilter,
    });
  }, [debouncedSearchQuery, priorityFilter, assigneeFilter, setParams]);

  // Get current user info
  const { data: currentUser, isLoading: loadingUser } = useQuery<CurrentUser>({
    queryKey: ["current-user"],
    queryFn: async () => {
      const token = await getToken();
      const response = await api.get("/users/me", {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      return response.data;
    },
    enabled: !!user,
  });

  // Get users to assign tasks
  const { data: users } = useQuery<UserType[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const token = await getToken();
      const response = await api.get(
        `/users`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        },
      );
      return response.data;
    },
    enabled: !!user && !!currentUser,
  });

  const handleOpenCreateModal = (status?: TaskStatus) => {
    setIsCreateOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setTaskToEdit(task);
    setIsEditOpen(true);
  };

  const { data: tasks, isLoading } = useQuery<Task[]>({
      queryKey: ["tasks"],
      queryFn: async () => {
          const token = await getToken();
          const response = await api.get("/tasks?limit=1000", {
              headers: {
                  Authorization: token ? `Bearer ${token}` : undefined,
              },
          });
          return response.data;
      },
      enabled: !!user && !!currentUser,
  });

  const createMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const token = await getToken();

      const payload = {
        title: data.title,
        description: data.description || "",
        status: data.status || "TODO",
        priority: data.priority || "MEDIUM",
        assigneeId:
          data.assigneeId && data.assigneeId !== "" ? data.assigneeId : undefined,
        estimatedHours: data.estimatedHours ? Number(data.estimatedHours) : 0,
        dueDate:
          data.dueDate && data.dueDate !== ""
            ? new Date(data.dueDate).toISOString()
            : undefined,
      };

      const response = await api.post("/tasks", payload, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setIsCreateOpen(false);
    },
    onError: (error) => {
      console.error("Task creation failed:", error);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TaskFormData }) => {
      const token = await getToken();
      const payload = {
        ...data,
        estimatedHours: data.estimatedHours
          ? Number(data.estimatedHours)
          : undefined,
      };
      return api.patch(`/tasks/${id}`, payload, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setIsEditOpen(false);
      setTaskToEdit(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const token = await getToken();
      return api.patch(
        `/tasks/${id}`,
        { status },
        {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const onCreateSubmit = (data: TaskFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: TaskFormData) => {
    if (taskToEdit) {
      updateTaskMutation.mutate({ id: taskToEdit.id, data });
    }
  };

  const assigneeOptions = useMemo(() => {
    if (!tasks) return [];
    const uniqueAssignees = new Map();
    tasks.forEach((t) => {
      if (t.assignee) {
        uniqueAssignees.set(t.assignee.id, t.assignee);
      }
    });
    return Array.from(uniqueAssignees.values()).map((a) => {
      const initials =
        ((a.firstName?.[0] || "") + (a.lastName?.[0] || "")).toUpperCase() ||
        "?";
      return {
        value: a.id,
        label: (
          <span className="flex items-center gap-2">
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-indigo-500 text-[10px] font-medium text-white">
              {initials}
            </span>
            <span>
              {a.firstName} {a.lastName}
            </span>
          </span>
        ),
      };
    });
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    const q = debouncedSearchQuery.toLowerCase().trim();

    return tasks.filter((task) => {
      const matchesSearch =
        !q ||
        task.title.toLowerCase().includes(q) ||
        (task.description ?? "").toLowerCase().includes(q);

      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;

      const matchesAssignee =
        assigneeFilter === "all" || task.assignee?.id === assigneeFilter;

      return matchesSearch && matchesPriority && matchesAssignee;
    });
  }, [tasks, debouncedSearchQuery, priorityFilter, assigneeFilter]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setPriorityFilter("all");
    setAssigneeFilter("all");
  };

  const hasActiveFilters =
    searchQuery !== "" || priorityFilter !== "all" || assigneeFilter !== "all";

  if (isLoading || loadingUser) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tasks</h1>
            <p className="text-muted-foreground">Manage your work items</p>
          </div>
        </div>
        <p>Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage your work items</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-md border p-1">
            <div className="flex">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                List
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("kanban")}
              >
                Kanban
              </Button>
            </div>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => handleOpenCreateModal(TaskStatusEnum.TODO)}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <TaskForm
                onSubmit={onCreateSubmit}
                onCancel={() => setIsCreateOpen(false)}
                isSubmitting={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>

          <Dialog
            open={isEditOpen}
            onOpenChange={(open) => {
              setIsEditOpen(open);
              if (!open) setTaskToEdit(null);
            }}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
              </DialogHeader>
              {taskToEdit && (
                <TaskForm
                  defaultValues={{
                    title: taskToEdit.title,
                    description: taskToEdit.description || "",
                    status: taskToEdit.status,
                    priority: taskToEdit.priority,
                    estimatedHours: taskToEdit.estimatedHours || undefined,
                    dueDate: taskToEdit.dueDate
                      ? new Date(taskToEdit.dueDate).toISOString().split("T")[0]
                      : "",
                    assigneeId: taskToEdit.assignee?.id,
                  }}
                  onSubmit={onEditSubmit}
                  onCancel={() => {
                    setIsEditOpen(false);
                    setTaskToEdit(null);
                  }}
                  isSubmitting={updateTaskMutation.isPending}
                  submitLabel="Save Changes"
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        assigneeFilter={assigneeFilter}
        onAssigneeChange={setAssigneeFilter}
        assigneeOptions={assigneeOptions}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        totalTasksCount={tasks?.length || 0}
        filteredTasksCount={filteredTasks.length}
      />

      {!tasks || tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-br from-blue-50 to-sky-100/50 dark:from-slate-800/40 dark:to-slate-800/10 rounded-2xl border border-blue-200 dark:border-slate-700/60 shadow-sm transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-blue-200/20 dark:bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 p-32 bg-sky-200/20 dark:bg-sky-500/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center p-6 text-center">
            <svg className="w-12 h-12 text-blue-400/80 dark:text-blue-500/60 mb-4 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-sky-900 dark:text-sky-100 mb-1">It's a blank slate</h3>
            <p className="text-sm border-blue-200 text-blue-600/80 dark:text-slate-400 max-w-[280px]">You don't have any tasks matching this criteria yet. Let's create your first task!</p>
          </div>
        </div>
      ) : (
        <TaskList
          tasks={filteredTasks}
          viewMode={viewMode}
          onAddTask={handleOpenCreateModal}
          onUpdateStatus={(id, status) =>
            updateStatusMutation.mutate({ id, status })
          }
          onEditTask={handleOpenEditModal}
          totalFilteredCount={filteredTasks.length}
        />
      )}
    </div>
  );
}
