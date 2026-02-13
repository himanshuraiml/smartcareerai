import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CreditBalanceCard from '../CreditBalanceCard';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    CreditCard: ({ className }: { className: string }) => (
        <svg data-testid="credit-icon" className={className} />
    ),
    Plus: ({ className }: { className: string }) => (
        <svg data-testid="plus-icon" className={className} />
    ),
}));

// Mock icon component for testing
const MockIcon = ({ className }: { className: string }) => (
    <svg data-testid="mock-icon" className={className} />
);

describe('CreditBalanceCard', () => {
    const defaultProps = {
        type: 'Resume Scans',
        balance: 10,
        icon: MockIcon,
        color: 'from-blue-500 to-cyan-500',
        onPurchase: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly with props', () => {
        render(<CreditBalanceCard {...defaultProps} />);

        expect(screen.getByText('Resume Scans')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('displays the provided icon', () => {
        render(<CreditBalanceCard {...defaultProps} />);
        expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });

    it('displays infinity symbol for unlimited credits', () => {
        render(<CreditBalanceCard {...defaultProps} balance={-1} />);
        expect(screen.getByText('∞')).toBeInTheDocument();
    });

    it('displays zero balance correctly', () => {
        render(<CreditBalanceCard {...defaultProps} balance={0} />);
        expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('displays large numbers correctly', () => {
        render(<CreditBalanceCard {...defaultProps} balance={999} />);
        expect(screen.getByText('999')).toBeInTheDocument();
    });

    it('calls onPurchase when plus button is clicked', () => {
        const onPurchase = jest.fn();
        render(<CreditBalanceCard {...defaultProps} onPurchase={onPurchase} />);

        const purchaseButton = screen.getByTestId('plus-icon').closest('button');
        expect(purchaseButton).toBeInTheDocument();

        if (purchaseButton) {
            fireEvent.click(purchaseButton);
        }

        expect(onPurchase).toHaveBeenCalledTimes(1);
    });

    it('applies glass styling', () => {
        const { container } = render(<CreditBalanceCard {...defaultProps} />);
        const card = container.firstChild;
        expect(card).toHaveClass('glass');
    });

    it('renders with different credit types', () => {
        const { rerender } = render(<CreditBalanceCard {...defaultProps} type="AI Interviews" />);
        expect(screen.getByText('AI Interviews')).toBeInTheDocument();

        rerender(<CreditBalanceCard {...defaultProps} type="Skill Tests" />);
        expect(screen.getByText('Skill Tests')).toBeInTheDocument();
    });

    it('applies color gradient to icon container', () => {
        const { container } = render(<CreditBalanceCard {...defaultProps} />);
        const iconContainer = container.querySelector('.bg-gradient-to-br');
        expect(iconContainer).toHaveClass('from-blue-500', 'to-cyan-500');
    });

    it('has proper styling for purchase button', () => {
        render(<CreditBalanceCard {...defaultProps} />);
        const purchaseButton = screen.getByTestId('plus-icon').closest('button');
        expect(purchaseButton).toHaveClass('hover:bg-white/10');
    });
});


