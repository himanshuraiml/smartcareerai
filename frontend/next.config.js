/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    output: 'standalone', // Required for Docker deployment
    images: {
        domains: ['localhost'],
        unoptimized: process.env.NODE_ENV === 'production', // For standalone build
    },
    async rewrites() {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        return [
            {
                source: '/api/:path*',
                destination: `${apiUrl}/api/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;
