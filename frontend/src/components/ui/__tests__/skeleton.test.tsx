import React from 'react';
import { render, screen } from '@testing-library/react';
import { Skeleton, SkeletonCard, SkeletonList, SkeletonTable } from '../Skeleton';

describe('Skeleton Components', () => {
    describe('Skeleton', () => {
        it('renders with default props', () => {
            const { container } = render(<Skeleton />);
            const skeleton = container.firstChild;
            expect(skeleton).toBeInTheDocument();
            expect(skeleton).toHaveClass('skeleton', 'animate-pulse');
        });

        it('applies variant classes correctly', () => {
            const { container, rerender } = render(<Skeleton variant="text" />);
            expect(container.firstChild).toHaveClass('skeleton-text');

            rerender(<Skeleton variant="avatar" />);
            expect(container.firstChild).toHaveClass('skeleton-avatar');

            rerender(<Skeleton variant="card" />);
            expect(container.firstChild).toHaveClass('skeleton-card');
        });

        it('applies rounded classes correctly', () => {
            const { container, rerender } = render(<Skeleton rounded="sm" />);
            expect(container.firstChild).toHaveClass('rounded-sm');

            rerender(<Skeleton rounded="full" />);
            expect(container.firstChild).toHaveClass('rounded-full');

            rerender(<Skeleton rounded="lg" />);
            expect(container.firstChild).toHaveClass('rounded-xl');
        });

        it('applies custom width and height', () => {
            const { container } = render(<Skeleton width="200px" height="100px" />);
            expect(container.firstChild).toHaveStyle({ width: '200px', height: '100px' });
        });

        it('applies custom className', () => {
            const { container } = render(<Skeleton className="custom-class" />);
            expect(container.firstChild).toHaveClass('custom-class');
        });
    });

    describe('SkeletonCard', () => {
        it('renders with default props', () => {
            const { container } = render(<SkeletonCard />);
            const card = container.firstChild;
            expect(card).toBeInTheDocument();
            expect(card).toHaveClass('glass');
        });

        it('renders avatar when showAvatar is true', () => {
            const { container } = render(<SkeletonCard showAvatar={true} />);
            const avatars = container.querySelectorAll('.skeleton-avatar');
            expect(avatars.length).toBe(1);
        });

        it('does not render avatar when showAvatar is false', () => {
            const { container } = render(<SkeletonCard showAvatar={false} />);
            const avatars = container.querySelectorAll('.skeleton-avatar');
            expect(avatars.length).toBe(0);
        });

        it('renders correct number of lines', () => {
            const { container } = render(<SkeletonCard lines={5} />);
            // 1 for header + 5 for lines
            const textSkeletons = container.querySelectorAll('.skeleton-text, .skeleton-text-sm');
            expect(textSkeletons.length).toBe(6);
        });

        it('applies custom className', () => {
            const { container } = render(<SkeletonCard className="custom-card" />);
            expect(container.firstChild).toHaveClass('custom-card');
        });
    });

    describe('SkeletonList', () => {
        it('renders default number of items', () => {
            const { container } = render(<SkeletonList />);
            const cards = container.querySelectorAll('.glass');
            expect(cards.length).toBe(5);
        });

        it('renders custom number of items', () => {
            const { container } = render(<SkeletonList count={3} />);
            const cards = container.querySelectorAll('.glass');
            expect(cards.length).toBe(3);
        });

        it('applies animation delay to each card', () => {
            const { container } = render(<SkeletonList count={3} />);
            const cards = container.querySelectorAll('.animate-slide-up');
            expect(cards.length).toBe(3);
        });
    });

    describe('SkeletonTable', () => {
        it('renders with default rows and columns', () => {
            const { container } = render(<SkeletonTable />);
            // Default is 5 rows + 1 header row = 6 rows total
            const rows = container.querySelectorAll('.flex.gap-4');
            expect(rows.length).toBe(6);
        });

        it('renders custom number of rows', () => {
            const { container } = render(<SkeletonTable rows={3} columns={2} />);
            // 3 data rows + 1 header = 4 total rows
            const rows = container.querySelectorAll('.flex.gap-4');
            expect(rows.length).toBe(4);
        });

        it('renders correct number of columns per row', () => {
            const { container } = render(<SkeletonTable rows={1} columns={6} />);
            // Each row should have 6 skeleton items
            const firstRow = container.querySelector('.flex.gap-4');
            const skeletons = firstRow?.querySelectorAll('.skeleton');
            expect(skeletons?.length).toBe(6);
        });

        it('has glass styling on container', () => {
            const { container } = render(<SkeletonTable />);
            const tableContainer = container.firstChild;
            expect(tableContainer).toHaveClass('glass');
        });
    });
});


