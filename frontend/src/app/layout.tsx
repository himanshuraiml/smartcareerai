import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { OnboardingProvider } from '@/components/onboarding/OnboardingTour';
import KeyboardShortcuts from '@/components/keyboard/KeyboardShortcuts';

const outfit = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] });

export const metadata: Metadata = {
    title: 'SmartCareerAI - AI-Powered Career Platform',
    description: 'Your unified career platform with AI-powered resume analysis, skill gap detection, and interview preparation.',
    keywords: ['career', 'resume', 'ATS', 'job search', 'AI', 'interview'],
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
                    <OnboardingProvider>
                        {children}
                        <KeyboardShortcuts />
                        <Toaster />
                    </OnboardingProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
