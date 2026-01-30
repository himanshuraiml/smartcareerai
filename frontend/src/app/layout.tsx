import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/providers/ThemeProvider';
import KeyboardShortcuts from '@/components/keyboard/KeyboardShortcuts';

const outfit = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] });

export const metadata: Metadata = {
    title: 'Medhiva - AI Guidance. Human Success.',
    description: 'Your AI-powered career platform with resume analysis, skill validation, and interview preparation. AI Guidance. Human Success.',
    keywords: ['career', 'resume', 'ATS', 'job search', 'AI', 'interview', 'Medhiva'],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark dark-mode">
            <body className={outfit.className}>
                <ThemeProvider>
                    {children}
                    <KeyboardShortcuts />
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    );
}
