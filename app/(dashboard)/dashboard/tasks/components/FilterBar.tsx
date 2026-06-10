import { FilterOption, FilterDropdown } from "./FilterDropdown";
import { SearchInput } from "./SearchInput";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  priorityFilter: string;
  onPriorityChange: (value: string) => void;
  assigneeFilter: string;
  onAssigneeChange: (value: string) => void;
  assigneeOptions: FilterOption[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  totalTasksCount: number;
  filteredTasksCount: number;
}

const PRIORITY_OPTIONS: FilterOption[] = [
  { value: "all", label: "All Priorities" },
  {
    value: "URGENT",
    label: (
      <span className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-red-400"></span> Urgent
      </span>
    ),
  },
  {
    value: "HIGH",
    label: (
      <span className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-orange-400"></span> High
      </span>
    ),
  },
  {
    value: "MEDIUM",
    label: (
      <span className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-yellow-400"></span> Medium
      </span>
    ),
  },
  {
    value: "LOW",
    label: (
      <span className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-gray-400"></span> Low
      </span>
    ),
  },
];

export function FilterBar({
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  assigneeFilter,
  onAssigneeChange,
  assigneeOptions,
  hasActiveFilters,
  onClearFilters,
  totalTasksCount,
  filteredTasksCount,
}: FilterBarProps) {
  return (
    <div className="space-y-3 w-full">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <SearchInput value={searchQuery} onChange={onSearchChange} />

        <FilterDropdown
          value={priorityFilter}
          onChange={onPriorityChange}
          options={PRIORITY_OPTIONS}
          ariaLabel="Filter by priority"
        />

        <FilterDropdown
          value={assigneeFilter}
          onChange={onAssigneeChange}
          options={[
            { value: "all", label: "All Assignees" },
            ...assigneeOptions,
          ]}
          ariaLabel="Filter by assignee"
        />

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            aria-label="Clear all filters"
            className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-blue-50 dark:bg-slate-800/60 text-blue-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 border border-blue-200 dark:border-slate-700/60 hover:border-red-200 dark:hover:border-red-800/50 transition-all duration-200 animate-in fade-in zoom-in-95 shadow-sm"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div
        aria-live="polite"
        className="text-xs text-gray-500 font-medium ml-1"
      >
        Showing {filteredTasksCount} of {totalTasksCount} tasks
      </div>
    </div>
  );
}
