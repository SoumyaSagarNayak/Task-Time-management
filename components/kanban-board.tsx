"use client";

import { useState, useMemo, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { TaskTimer } from "@/components/task-timer";
import { Calendar, Clock, GripVertical, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { Task, TaskStatus, TaskPriority } from "@/lib/types";
import { TaskStatus as TaskStatusEnum } from "@/lib/types";

import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { createPortal } from "react-dom";

// ─── Column definitions (6 statuses) ─────────────────────────────────
const COLUMNS: {
  id: TaskStatus;
  label: string;
  color: string;
  dotColor: string;
  bgAccent: string;
}[] = [
  {
    id: TaskStatusEnum.OPEN,
    label: "Open",
    color: "text-sky-600 dark:text-sky-400",
    dotColor: "bg-sky-500",
    bgAccent: "bg-sky-500/10 border-sky-500/20",
  },
  {
    id: TaskStatusEnum.TODO,
    label: "To Do",
    color: "text-blue-600 dark:text-blue-400",
    dotColor: "bg-blue-500",
    bgAccent: "bg-blue-500/10 border-blue-500/20",
  },
  {
    id: TaskStatusEnum.IN_PROGRESS,
    label: "In Progress",
    color: "text-amber-600 dark:text-amber-400",
    dotColor: "bg-amber-500",
    bgAccent: "bg-amber-500/10 border-amber-500/20",
  },
  {
    id: TaskStatusEnum.IN_REVIEW,
    label: "In Review",
    color: "text-purple-600 dark:text-purple-400",
    dotColor: "bg-purple-500",
    bgAccent: "bg-purple-500/10 border-purple-500/20",
  },
  {
    id: TaskStatusEnum.DONE,
    label: "Done",
    color: "text-emerald-600 dark:text-emerald-400",
    dotColor: "bg-emerald-500",
    bgAccent: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: TaskStatusEnum.CLOSED,
    label: "Closed",
    color: "text-gray-500 dark:text-gray-400",
    dotColor: "bg-gray-400",
    bgAccent: "bg-gray-400/10 border-gray-400/20",
  },
];

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; border: string }
> = {
  LOW: {
    label: "Low",
    color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    border: "border-l-slate-400",
  },
  MEDIUM: {
    label: "Medium",
    color:
      "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    border: "border-l-yellow-400",
  },
  HIGH: {
    label: "High",
    color:
      "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    border: "border-l-orange-500",
  },
  URGENT: {
    label: "Urgent",
    color: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    border: "border-l-red-500",
  },
};

// ─── Component Props ──────────────────────────────────────────────────
interface KanbanBoardProps {
  tasks: Task[];
  onAddTask?: (status: TaskStatus) => void;
  onEditTask?: (task: Task) => void;
}

export function KanbanBoard({
  tasks,
  onAddTask,
  onEditTask,
}: KanbanBoardProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // ─── Sensors ──────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Avoid accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // ─── Status update mutation ─────
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      boardOrder,
    }: {
      id: string;
      status: TaskStatus;
      boardOrder: number;
    }) => {
      const token = await getToken();
      return api.patch(
        `/tasks/${id}/status`,
        { status, boardOrder },
        { headers: { Authorization: token ? `Bearer ${token}` : undefined } },
      );
    },
    onMutate: async ({ id, status, boardOrder }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);
      queryClient.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (old) =>
        old?.map((t) => (t.id === id ? { ...t, status, boardOrder } : t)),
      );
      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueriesData(
          { queryKey: ["tasks"] },
          context.previousTasks,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // ─── Group tasks by status ────────────────────────────────────────
  const grouped = useMemo(() => {
    const acc = {} as Record<TaskStatus, Task[]>;
    COLUMNS.forEach((col) => (acc[col.id] = []));
    tasks.forEach((task) => {
      if (acc[task.status]) acc[task.status].push(task);
    });
    // Sort each column by boardOrder
    Object.keys(acc).forEach((key) => {
      acc[key as TaskStatus].sort(
        (a, b) => (a.boardOrder || 0) - (b.boardOrder || 0),
      );
    });
    return acc;
  }, [tasks]);

  // ─── Drag Handlers ───────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // 1. Find if we dropped over a task OR a column
    let overTask = tasks.find((t) => t.id === overId);
    let targetStatus: TaskStatus;
    let targetTasks: Task[];

    if (overTask) {
      targetStatus = overTask.status;
      targetTasks = grouped[targetStatus];
    } else {
      // Dropped over column? (overId would be status)
      targetStatus = overId as TaskStatus;
      targetTasks = grouped[targetStatus];
    }

    const isSameColumn = activeTask.status === targetStatus;

    // 2. Calculate new boardOrder
    let newOrder: number;

    if (overTask) {
      const overIndex = targetTasks.findIndex((t) => t.id === overId);

      if (isSameColumn) {
        const activeIndex = targetTasks.findIndex((t) => t.id === activeId);
        const sorted = arrayMove(targetTasks, activeIndex, overIndex);
        const idx = sorted.findIndex((t) => t.id === activeId);
        newOrder = calculateNewOrder(sorted, idx);
      } else {
        // Moving into new column at specific position
        const newTasks = [...targetTasks];
        newTasks.splice(overIndex, 0, activeTask);
        newOrder = calculateNewOrder(newTasks, overIndex);
      }
    } else {
      // Dropped into empty column or bottom of column
      if (targetTasks.length === 0) {
        newOrder = 1000;
      } else {
        // Add to bottom
        newOrder = (targetTasks[targetTasks.length - 1].boardOrder || 0) + 1000;
      }
    }

    // Only update if something actually changed (status OR order significantly)
    const oldOrder = activeTask.boardOrder || 0;
    if (
      activeTask.status !== targetStatus ||
      Math.abs(oldOrder - newOrder) > 0.0001
    ) {
      updateMutation.mutate({
        id: activeId,
        status: targetStatus,
        boardOrder: newOrder,
      });
    }
  };

  function calculateNewOrder(sortedTasks: Task[], index: number): number {
    const prev = sortedTasks[index - 1];
    const next = sortedTasks[index + 1];

    if (!prev && !next) return 1000;
    if (!prev) return (next.boardOrder || 0) / 2;
    if (!next) return (prev.boardOrder || 0) + 1000;
    return ((prev.boardOrder || 0) + (next.boardOrder || 0)) / 2;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <div className="flex gap-4 h-[calc(100vh-220px)] overflow-x-auto pb-4 kanban-scrollbar">
        {COLUMNS.map((column) => {
          const columnTasks = grouped[column.id] || [];

          return (
            <KanbanColumn
              key={column.id}
              column={column}
              columnTasks={columnTasks}
              onAddTask={onAddTask}
              onEditTask={onEditTask}
            />
          );
        })}
      </div>

      {/* Drag Overlay */}
      {typeof document !== "undefined" &&
        createPortal(
          <DragOverlay adjustScale={true}>
            {activeTask ? (
              <div className="w-[234px] rotate-2 scale-105 opacity-80 pointer-events-none">
                <TaskCard task={activeTask} isDragging={false} />
              </div>
            ) : null}
          </DragOverlay>,
          document.body,
        )}
    </DndContext>
  );
}

// ─── Kanban Column (Droppable) ─────────────────────────────────────────
function KanbanColumn({
  column,
  columnTasks,
  onAddTask,
  onEditTask,
}: {
  column: any;
  columnTasks: Task[];
  onAddTask?: (status: TaskStatus) => void;
  onEditTask?: (task: Task) => void;
}) {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
  });

  return (
    <div className="flex-shrink-0 w-[260px] flex flex-col">
      <SortableContext
        items={columnTasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={cn(
            "rounded-xl border h-full flex flex-col transition-all duration-200",
            "bg-sky-50 dark:bg-slate-800/40",
            "border-sky-100 dark:border-slate-700/60",
          )}
          id={column.id}
        >
          {/* Column Header */}
          <div className="px-4 py-3.5 bg-blue-100/30 dark:bg-slate-800/80 border-b border-sky-100 dark:border-slate-700/80 flex items-center gap-3 shrink-0 rounded-t-xl">
            <div
              className={cn(
                "w-2.5 h-2.5 rounded-full shrink-0",
                column.dotColor,
              )}
            />
            <h3
              className={cn(
                "text-xs font-semibold uppercase tracking-wide",
                column.color,
              )}
            >
              {column.label}
            </h3>
            <span
              className={cn(
                "ml-auto text-xs font-bold px-2 py-0.5 rounded-full border transition-transform",
                column.bgAccent,
              )}
            >
              {columnTasks.length}
            </span>
          </div>

          {/* Card List */}
          <div
            className={cn(
              "flex-1 overflow-y-auto p-3 space-y-3 kanban-column-scroll bg-transparent rounded-b-xl",
            )}
          >
            {columnTasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onEditTask={onEditTask}
              />
            ))}
            {onAddTask && (
              <button
                onClick={() => onAddTask(column.id)}
                className="flex items-center gap-2 mt-2 w-full py-2 px-3 text-sm font-medium text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 rounded-lg hover:bg-sky-100 dark:hover:bg-slate-700/50 transition-colors border border-transparent hover:border-sky-200 dark:hover:border-slate-600"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            )}
          </div>
        </div>
      </SortableContext>
    </div>
  );
}

// ─── Sortable Task Card Wrapper ───────────────────────────────────────
function SortableTaskCard({
  task,
  onEditTask,
}: {
  task: Task;
  onEditTask?: (task: Task) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} isDragging={isDragging} onEditTask={onEditTask} />
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────
function TaskCard({
  task,
  isDragging,
  onEditTask,
}: {
  task: Task;
  isDragging: boolean;
  onEditTask?: (task: Task) => void;
}) {
  const priority = PRIORITY_CONFIG[task.priority];

  return (
    <Link href={`/dashboard/tasks/${task.id}`}>
      <div
        className={cn(
          "group relative rounded-lg border-l-[3px] bg-white dark:bg-gray-800/80",
          "border border-gray-200/80 dark:border-gray-700/50",
          "p-3.5 cursor-grab active:cursor-grabbing select-none touch-none",
          "hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600",
          "transition-all duration-200",
          priority.border,
          isDragging && "opacity-40 scale-95 shadow-none",
        )}
      >
        {/* Drag Handle */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-40 transition-opacity">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>

        {/* Title and Edit Button */}
        <div className="flex justify-between items-start gap-2 mb-2.5">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">
            {task.title}
          </h4>
          {onEditTask && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault(); // Prevent Link navigation
                onEditTask(task);
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              aria-label="Edit Task"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
              </svg>
            </button>
          )}
        </div>

        {/* Description Preview */}
        {task.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Tags Row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] font-semibold px-1.5 py-0 h-5 uppercase tracking-wider rounded",
              priority.color,
            )}
          >
            {priority.label}
          </Badge>
          {task.tags &&
            task.tags.map((tag) => (
              <Badge
                key={tag.id}
                className="text-[10px] border-none text-white px-1.5 py-0 h-5 rounded"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </Badge>
            ))}
        </div>

        {/* Timer row */}
        <div className="mb-3">
          <TaskTimer taskId={task.id} taskTitle={task.title} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-700/40">
          <div className="flex items-center gap-3">
            {task.estimatedHours && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {task.estimatedHours}h
              </span>
            )}
            {task.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>

          {/* Assignee Avatars */}
          {task.assignee && (
            <div className="flex -space-x-1.5">
              <div
                className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[9px] font-bold border-2 border-white dark:border-gray-800 ring-0"
                title={
                  `${task.assignee.firstName || ""} ${task.assignee.lastName || ""}`.trim() ||
                  task.assignee.email
                }
              >
                {`${(task.assignee.firstName || "")[0] || ""}${(task.assignee.lastName || "")[0] || ""}`.toUpperCase() ||
                  "?"}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
