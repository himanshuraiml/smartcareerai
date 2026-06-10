import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

export const viewport: Viewport = {
    themeColor: '#2563EB',
};

export const metadata: Metadata = {
    metadataBase: new URL('https://placenxt.com'),
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
                url: '/og-image.png',
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
        creator: '@placenxt',
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
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'PlaceNxt',
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
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                {/* Google Tag Manager (noscript) */}
                <noscript>
                    <iframe
                        src="https://www.googletagmanager.com/ns.html?id=GTM-5CWCWX6J"
                        height="0"
                        width="0"
                        style={{ display: 'none', visibility: 'hidden' }}
                    />
                </noscript>
                {children}
                <Script
                    src="https://www.googletagmanager.com/gtag/js?id=G-8RFSVCFQTE"
                    strategy="afterInteractive"
                />
                <Script id="google-analytics" strategy="afterInteractive">
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', 'G-8RFSVCFQTE');
                    `}
                </Script>
                {/* Google Tag Manager */}
                <Script id="google-tag-manager" strategy="afterInteractive">
                    {`
                        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                        })(window,document,'script','dataLayer','GTM-5CWCWX6J');
                    `}
                </Script>
            </body>
        </html>
    );
}
