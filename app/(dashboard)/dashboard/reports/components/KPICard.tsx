import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        isUp: boolean;
    };
    colorClass: string;
}

export function KPICard({ title, value, subtitle, icon: Icon, trend, colorClass }: KPICardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className={`rounded-lg p-2 ${colorClass} bg-opacity-10 dark:bg-opacity-20`}>
                    <Icon className={`h-4 w-4 ${colorClass}`} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {(subtitle || trend) && (
                    <div className="flex items-center mt-1">
                        {trend && (
                            <span className={`text-xs mr-2 font-medium ${trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
                                {trend.isUp ? '↑' : '↓'} {trend.value}%
                            </span>
                        )}
                        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
