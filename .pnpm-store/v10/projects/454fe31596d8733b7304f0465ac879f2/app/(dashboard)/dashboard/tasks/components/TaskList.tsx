'use client';

import { Task, TaskPriority, TaskStatus, TaskStatus as TaskStatusEnum } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TaskTimer } from '@/components/task-timer';
import { Calendar, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { KanbanBoard } from '@/components/kanban-board';
import { EmptyState } from './EmptyState';

const statusColors: Record<TaskStatus, string> = {
    OPEN: 'bg-sky-100 text-sky-700',
    TODO: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    IN_REVIEW: 'bg-purple-100 text-purple-700',
    DONE: 'bg-green-100 text-green-700',
    CLOSED: 'bg-gray-200 text-gray-500',
};

const priorityColors: Record<TaskPriority, string> = {
    LOW: 'bg-gray-100 text-gray-600',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    HIGH: 'bg-orange-100 text-orange-700',
    URGENT: 'bg-red-100 text-red-700',
};

interface TaskListProps {
    tasks: Task[];
    viewMode: 'grid' | 'kanban';
    onAddTask: (status?: TaskStatus) => void;
    onUpdateStatus: (id: string, status: TaskStatus) => void;
    onEditTask?: (task: Task) => void;
    totalFilteredCount?: number;
}

export function TaskList({ tasks, viewMode, onAddTask, onUpdateStatus, onEditTask, totalFilteredCount }: TaskListProps) {
    if (totalFilteredCount === 0) {
        return <EmptyState />;
    }

    return (
        <>
            {viewMode === 'grid' ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tasks.map((task) => (
                        <Card key={task.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-lg">{task.title}</CardTitle>
                                    <Badge className={priorityColors[task.priority]}>
                                        {task.priority}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {task.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {task.description}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Badge className={statusColors[task.status]}>
                                        {task.status.replace('_', ' ')}
                                    </Badge>
                                    {task.estimatedHours && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {task.estimatedHours}h
                                        </span>
                                    )}
                                </div>
                                {task.assignee && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="h-3 w-3 text-gray-400" />
                                        <div className="flex flex-wrap gap-1">
                                            <span className="text-gray-600">
                                                {task.assignee.firstName} {task.assignee.lastName}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {task.dueDate && (
                                    <p className="text-xs text-gray-500">
                                        Due: {formatDate(task.dueDate)}
                                    </p>
                                )}
                                <div className="pt-1">
                                    <TaskTimer taskId={task.id} taskTitle={task.title} />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    {task.status !== TaskStatusEnum.DONE && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() =>
                                                onUpdateStatus(
                                                    task.id,
                                                    task.status === TaskStatusEnum.TODO
                                                        ? TaskStatusEnum.IN_PROGRESS
                                                        : TaskStatusEnum.DONE
                                                )
                                            }
                                        >
                                            {task.status === TaskStatusEnum.TODO ? 'Start' : 'Complete'}
                                        </Button>
                                    )}
                                    {onEditTask && (
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="flex-1"
                                            onClick={() => onEditTask(task)}
                                        >
                                            Edit
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <KanbanBoard tasks={tasks} onAddTask={onAddTask} onEditTask={onEditTask} />
            )}
        </>
    );
}
