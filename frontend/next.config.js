/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Use 'standalone' only for Docker deployments, Vercel handles this automatically
    output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
            },
            {
                protocol: 'https',
                hostname: '**.vercel.app',
            },
            {
                protocol: 'https',
                hostname: 'placenxt.com',
            },
            {
                protocol: 'https',
                hostname: '**.placenxt.com',
            },
        ],
    },
    async rewrites() {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        // Only apply rewrites if API URL is configured (for local dev proxy)
        if (!apiUrl || process.env.VERCEL) {
            return [];
        }
        return [
            {
                source: '/api/:path((?!keystatic).*)',
                destination: `${apiUrl}/api/:path*`,
            },
        ];
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'no-referrer-when-downgrade',
                    },
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin-allow-popups',
                    },
                    {
                        key: 'Cross-Origin-Embedder-Policy',
                        value: 'credentialless',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(self), microphone=(self), geolocation=()',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' http://localhost:* https: wss:; frame-src https://accounts.google.com; frame-ancestors 'none';",
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
