import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportChartAsImage } from '../utils/export';

interface ChartCardProps {
    title: string;
    children: React.ReactNode;
    chartId: string;
    className?: string;
}

export function ChartCard({ title, children, chartId, className }: ChartCardProps) {
    const handleExport = () => {
        exportChartAsImage(chartId, `${title.replace(/\s+/g, '_').toLowerCase()}`);
    };

    return (
        <Card className={`flex flex-col relative ${className || ''}`} id={chartId}>
            <div className="absolute right-4 top-4 z-10">
                <Button variant="ghost" size="icon" onClick={handleExport} title="Export as PNG">
                    <Download className="h-4 w-4 text-gray-500" />
                </Button>
            </div>
            <div className="p-6 pb-2 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold text-lg">{title}</h3>
            </div>
            <div className="p-6 flex-1 min-h-[300px] w-full">
                {children}
            </div>
        </Card>
    );
}
