import type { Metadata } from 'next';
import '../globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { GoogleAuthProviderWrapper } from '@/providers/GoogleAuthProvider';
import KeyboardShortcuts from '@/components/keyboard/KeyboardShortcuts';

export const metadata: Metadata = {
    metadataBase: new URL('https://placenxt.com'), // Replace with actual domain
    title: {
        default: 'PlaceNxt - AI Career & Placement Platform',
        template: '%s | PlaceNxt'
    },
    description: 'Boost your placement success with AI-powered resume scoring, mock interviews, and skill verification. The ultimate career platform for students.',
    keywords: ['career', 'resume', 'ATS', 'job search', 'AI', 'interview', 'placement', 'PlaceNxt', 'students', 'resume buider', 'mock interview', 'campus placement'],
    authors: [{ name: 'PlaceNxt Team' }],
    creator: 'PlaceNxt',
    publisher: 'PlaceNxt',
    openGraph: {
        title: 'PlaceNxt - Get Placed. Get Ahead.',
        description: 'AI-powered career platform for students. Resume scoring, mock interviews, skill badges, and job tracking.',
        url: 'https://placenxt.com',
        siteName: 'PlaceNxt',
        locale: 'en_US',
        type: 'website',
        images: [
            {
                url: '/og-image.png', // Ensure this image exists in public folder
                width: 1200,
                height: 630,
                alt: 'PlaceNxt Platform Preview',
            }
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'PlaceNxt - AI Career & Placement Platform',
        description: 'Boost your placement success with AI-powered resume scoring, mock interviews, and skill verification.',
        creator: '@placenxt', // Replace with actual handle if available
        images: ['/og-image.png'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body style={{ fontFamily: "'Inter', sans-serif" }}>
                <GoogleAuthProviderWrapper>
                    <ThemeProvider>
                        {children}
                        <KeyboardShortcuts />
                        <Toaster />
                    </ThemeProvider>
                </GoogleAuthProviderWrapper>
            </body>
        </html>
    );
}


