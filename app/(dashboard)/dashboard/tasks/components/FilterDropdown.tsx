"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterOption {
  value: string;
  label: React.ReactNode;
}

interface FilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  ariaLabel: string;
  placeholder?: string;
}

export function FilterDropdown({
  value,
  onChange,
  options,
  ariaLabel,
  placeholder = "Select...",
}: FilterDropdownProps) {
  // Map our internal 'all' to the empty string for Radix Select, as it doesn't always handle special non-empty strings as "none" well without custom logic,
  // but we can just use the provided values as they are standard strings.
  // We actually need to handle the 'all' explicitly as a valid select value.
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className="bg-blue-50/30 dark:bg-slate-800/40 border border-blue-100 dark:border-slate-700/60 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 cursor-pointer w-[180px] hover:bg-blue-100/40 dark:hover:bg-slate-700/50 transition-colors"
        aria-label={ariaLabel}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
