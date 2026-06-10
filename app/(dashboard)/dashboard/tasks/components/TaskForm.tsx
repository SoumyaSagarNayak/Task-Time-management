'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TaskStatus as TaskStatusEnum, TaskPriority as TaskPriorityEnum } from '@/lib/types';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AssigneeDropdown } from '@/components/assignee-dropdown';

export const taskSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional(),
    status: z.nativeEnum(TaskStatusEnum).optional(),
    priority: z.nativeEnum(TaskPriorityEnum).optional(),
    estimatedHours: z.number().positive().optional(),
    dueDate: z.string().optional(),
    assigneeId: z.string().optional(),
});

export type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
    defaultValues?: Partial<TaskFormData>;
    onSubmit: (data: TaskFormData) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
    submitLabel?: string;
}

export function TaskForm({
    defaultValues,
    onSubmit,
    onCancel,
    isSubmitting = false,
    submitLabel = 'Save Task',
}: TaskFormProps) {
    const form = useForm<TaskFormData>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: '',
            description: '',
            status: TaskStatusEnum.TODO,
            priority: TaskPriorityEnum.MEDIUM,
            estimatedHours: undefined,
            dueDate: '',
            assigneeId: undefined,
            ...defaultValues,
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter task title" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Enter task description"
                                    rows={4}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="OPEN">Open</SelectItem>
                                        <SelectItem value="TODO">To Do</SelectItem>
                                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                        <SelectItem value="IN_REVIEW">In Review</SelectItem>
                                        <SelectItem value="DONE">Done</SelectItem>
                                        <SelectItem value="CLOSED">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Priority</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="LOW">Low</SelectItem>
                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                        <SelectItem value="URGENT">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="estimatedHours"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estimated Hours</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.5"
                                        placeholder="8"
                                        {...field}
                                        onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Due Date</FormLabel>
                                <FormControl>
                                    <Input
                                        type="date"
                                        // min={new Date().toISOString().split('T')[0]} // removed min date to let users edit past due items
                                        {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="assigneeId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Assign To</FormLabel>
                            <FormControl>
                                <AssigneeDropdown value={field.value} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : submitLabel}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
