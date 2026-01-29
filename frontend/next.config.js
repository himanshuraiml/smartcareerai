/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
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
                hostname: 'medhiva.com',
            },
            {
                protocol: 'https',
                hostname: '**.medhiva.com',
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
                source: '/api/:path*',
                destination: `${apiUrl}/api/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;
