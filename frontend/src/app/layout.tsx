import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/providers/ThemeProvider';
import KeyboardShortcuts from '@/components/keyboard/KeyboardShortcuts';

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] });

export const metadata: Metadata = {
    title: 'PlaceNxt - Get Placed. Get Ahead.',
    description: 'AI-powered career platform for students. Resume scoring, mock interviews, skill badges, and job tracking. Get placement-ready with PlaceNxt.',
    keywords: ['career', 'resume', 'ATS', 'job search', 'AI', 'interview', 'placement', 'PlaceNxt', 'students'],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark dark-mode">
            <body className={inter.className}>
                <ThemeProvider>
                    {children}
                    <KeyboardShortcuts />
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    );
}
