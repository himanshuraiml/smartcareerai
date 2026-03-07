'use client';

import React, { useMemo } from 'react';

interface MeetingHeatmapProps {
    /** { "YYYY-MM-DD": count } */
    data: Record<string, number>;
    /** How many weeks to show (default: 26 = ~6 months) */
    weeks?: number;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getColor(count: number): string {
    if (count === 0) return 'bg-zinc-800';
    if (count === 1) return 'bg-violet-900';
    if (count === 2) return 'bg-violet-700';
    if (count <= 4) return 'bg-violet-500';
    return 'bg-violet-400';
}

export function MeetingHeatmap({ data, weeks = 26 }: MeetingHeatmapProps) {
    const grid = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Go back `weeks` weeks, starting from Sunday
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay() - (weeks - 1) * 7);

        const columns: Array<{ month?: string; days: Array<{ date: string; count: number; dayOfWeek: number }> }> = [];
        let currentDate = new Date(startDate);
        let prevMonth = -1;

        for (let w = 0; w < weeks; w++) {
            const col: (typeof columns)[0] = { days: [] };
            const firstDayOfWeek = new Date(currentDate);
            if (firstDayOfWeek.getMonth() !== prevMonth) {
                col.month = MONTH_NAMES[firstDayOfWeek.getMonth()];
                prevMonth = firstDayOfWeek.getMonth();
            }
            for (let d = 0; d < 7; d++) {
                const dateStr = currentDate.toISOString().slice(0, 10);
                col.days.push({
                    date: dateStr,
                    count: data[dateStr] ?? 0,
                    dayOfWeek: currentDate.getDay(),
                });
                currentDate.setDate(currentDate.getDate() + 1);
            }
            columns.push(col);
        }
        return columns;
    }, [data, weeks]);

    const maxCount = Math.max(...Object.values(data), 1);

    return (
        <div className="space-y-2">
            {/* Month labels */}
            <div className="flex gap-1 pl-8">
                {grid.map((col, i) => (
                    <div key={i} className="w-4 shrink-0 text-xs text-zinc-500 truncate">
                        {col.month ?? ''}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="flex gap-1">
                {/* Day labels */}
                <div className="flex flex-col gap-1 pr-1">
                    {DAY_LABELS.map((d, i) => (
                        <div key={i} className="h-4 w-7 text-xs text-zinc-600 flex items-center">
                            {i % 2 === 1 ? d : ''}
                        </div>
                    ))}
                </div>

                {/* Columns */}
                {grid.map((col, wi) => (
                    <div key={wi} className="flex flex-col gap-1">
                        {col.days.map((day, di) => (
                            <div
                                key={di}
                                className={`w-4 h-4 rounded-sm ${getColor(day.count)} cursor-default transition-colors`}
                                title={`${day.date}: ${day.count} meeting${day.count !== 1 ? 's' : ''}`}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 pl-8 pt-1">
                <span className="text-xs text-zinc-500">Less</span>
                {[0, 1, 2, 3, 4].map(v => (
                    <div key={v} className={`w-4 h-4 rounded-sm ${getColor(v === 4 ? 5 : v)}`} />
                ))}
                <span className="text-xs text-zinc-500">More</span>
            </div>
        </div>
    );
}
