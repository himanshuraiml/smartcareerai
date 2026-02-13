'use client';

import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'text-sm' | 'avatar' | 'card' | 'custom';
    width?: string;
    height?: string;
    rounded?: 'sm' | 'md' | 'lg' | 'full';
}

/**
 * Skeleton loading component with various presets
 */
export function Skeleton({
    className = '',
    variant = 'custom',
    width,
    height,
    rounded = 'md'
}: SkeletonProps) {
    const baseClasses = 'skeleton animate-pulse';

    const roundedClasses = {
        sm: 'rounded-sm',
        md: 'rounded-lg',
        lg: 'rounded-xl',
        full: 'rounded-full'
    };

    const variantClasses = {
        'text': 'h-4 w-full skeleton-text',
        'text-sm': 'h-3 w-3/5 skeleton-text-sm',
        'avatar': 'w-12 h-12 skeleton-avatar',
        'card': 'h-32 w-full skeleton-card',
        'custom': ''
    };

    const style: React.CSSProperties = {};
    if (width) style.width = width;
    if (height) style.height = height;

    return (
        <div
            className={`${baseClasses} ${roundedClasses[rounded]} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
}

interface SkeletonCardProps {
    className?: string;
    showAvatar?: boolean;
    lines?: number;
    style?: React.CSSProperties;
}

/**
 * Pre-composed skeleton card for common loading states
 */
export function SkeletonCard({ className = '', showAvatar = true, lines = 3, style }: SkeletonCardProps) {
    return (
        <div className={`p-4 rounded-xl glass ${className}`} style={style}>
            <div className="flex gap-4">
                {showAvatar && <Skeleton variant="avatar" />}
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="60%" />
                    {Array.from({ length: lines }).map((_, i) => (
                        <Skeleton
                            key={i}
                            variant={i === lines - 1 ? 'text-sm' : 'text'}
                            width={i === lines - 1 ? '40%' : '100%'}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

interface SkeletonListProps {
    count?: number;
    className?: string;
}

/**
 * Skeleton list for loading states in lists/tables
 */
export function SkeletonList({ count = 5, className = '' }: SkeletonListProps) {
    return (
        <div className={`space-y-4 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} className="animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
        </div>
    );
}

interface SkeletonTableProps {
    rows?: number;
    columns?: number;
    className?: string;
}

/**
 * Skeleton table for loading data tables
 */
export function SkeletonTable({ rows = 5, columns = 4, className = '' }: SkeletonTableProps) {
    return (
        <div className={`rounded-xl glass overflow-hidden ${className}`}>
            {/* Header */}
            <div className="flex gap-4 p-4 border-b border-white/5">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} variant="text" width={i === 0 ? '120px' : '80px'} />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-4 p-4 border-b border-white/5 last:border-b-0">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton key={colIndex} variant="text-sm" width={colIndex === 0 ? '120px' : '80px'} />
                    ))}
                </div>
            ))}
        </div>
    );
}

export default { Skeleton, SkeletonCard, SkeletonList, SkeletonTable };


