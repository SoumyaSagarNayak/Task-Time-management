import { SearchX } from 'lucide-react';

export function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gray-800/50 p-4 rounded-full mb-4">
                <SearchX className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-200 mb-1">No tasks found</h3>
            <p className="text-sm text-gray-500 max-w-sm">
                No tasks match your current filters. Try adjusting your search query or removing some filters.
            </p>
        </div>
    );
}
