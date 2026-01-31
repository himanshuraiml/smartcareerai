import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card';

describe('Card Components', () => {
    describe('Card', () => {
        it('renders correctly with children', () => {
            render(<Card data-testid="card">Card Content</Card>);
            const card = screen.getByTestId('card');
            expect(card).toBeInTheDocument();
            expect(card).toHaveTextContent('Card Content');
        });

        it('applies custom className', () => {
            render(<Card data-testid="card" className="custom-class">Content</Card>);
            const card = screen.getByTestId('card');
            expect(card).toHaveClass('custom-class');
        });

        it('forwards ref correctly', () => {
            const ref = React.createRef<HTMLDivElement>();
            render(<Card ref={ref}>Content</Card>);
            expect(ref.current).toBeInstanceOf(HTMLDivElement);
        });

        it('passes additional props to underlying element', () => {
            render(<Card data-testid="card" id="test-card">Content</Card>);
            const card = screen.getByTestId('card');
            expect(card).toHaveAttribute('id', 'test-card');
        });
    });

    describe('CardHeader', () => {
        it('renders correctly', () => {
            render(<CardHeader data-testid="header">Header Content</CardHeader>);
            const header = screen.getByTestId('header');
            expect(header).toBeInTheDocument();
            expect(header).toHaveTextContent('Header Content');
        });

        it('applies custom className', () => {
            render(<CardHeader data-testid="header" className="custom-header">Header</CardHeader>);
            const header = screen.getByTestId('header');
            expect(header).toHaveClass('custom-header');
        });
    });

    describe('CardTitle', () => {
        it('renders as h3 element', () => {
            render(<CardTitle>Title</CardTitle>);
            const title = screen.getByRole('heading', { level: 3 });
            expect(title).toBeInTheDocument();
            expect(title).toHaveTextContent('Title');
        });

        it('applies custom className', () => {
            render(<CardTitle data-testid="title" className="custom-title">Title</CardTitle>);
            const title = screen.getByTestId('title');
            expect(title).toHaveClass('custom-title');
        });
    });

    describe('CardDescription', () => {
        it('renders correctly', () => {
            render(<CardDescription data-testid="desc">Description text</CardDescription>);
            const desc = screen.getByTestId('desc');
            expect(desc).toBeInTheDocument();
            expect(desc).toHaveTextContent('Description text');
        });

        it('applies muted foreground styling', () => {
            render(<CardDescription data-testid="desc">Description</CardDescription>);
            const desc = screen.getByTestId('desc');
            expect(desc).toHaveClass('text-muted-foreground');
        });
    });

    describe('CardContent', () => {
        it('renders correctly', () => {
            render(<CardContent data-testid="content">Content here</CardContent>);
            const content = screen.getByTestId('content');
            expect(content).toBeInTheDocument();
            expect(content).toHaveTextContent('Content here');
        });
    });

    describe('CardFooter', () => {
        it('renders correctly', () => {
            render(<CardFooter data-testid="footer">Footer content</CardFooter>);
            const footer = screen.getByTestId('footer');
            expect(footer).toBeInTheDocument();
            expect(footer).toHaveTextContent('Footer content');
        });

        it('has flex layout', () => {
            render(<CardFooter data-testid="footer">Footer</CardFooter>);
            const footer = screen.getByTestId('footer');
            expect(footer).toHaveClass('flex');
        });
    });

    describe('Full Card composition', () => {
        it('renders a complete card with all subcomponents', () => {
            render(
                <Card data-testid="full-card">
                    <CardHeader>
                        <CardTitle>Test Title</CardTitle>
                        <CardDescription>Test Description</CardDescription>
                    </CardHeader>
                    <CardContent>Main content area</CardContent>
                    <CardFooter>Footer actions</CardFooter>
                </Card>
            );

            expect(screen.getByTestId('full-card')).toBeInTheDocument();
            expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Test Title');
            expect(screen.getByText('Test Description')).toBeInTheDocument();
            expect(screen.getByText('Main content area')).toBeInTheDocument();
            expect(screen.getByText('Footer actions')).toBeInTheDocument();
        });
    });
});
