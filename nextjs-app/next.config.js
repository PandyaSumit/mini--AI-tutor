/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,

    // Image optimization
    images: {
        domains: ['localhost'],
        formats: ['image/avif', 'image/webp'],
    },

    // API proxy to backend
    async rewrites() {
        // Guard against environment values like the literal string 'undefined'
        let backendUrl = process.env.BACKEND_API_URL;
        if (!backendUrl || backendUrl === 'undefined') {
            backendUrl = 'http://localhost:5000/api';
        }

        return [
            {
                source: '/api/:path*',
                destination: `${backendUrl}/:path*`,
            },
        ];
    },

    // Environment variables
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    },

    // TypeScript
    typescript: {
        ignoreBuildErrors: false,
    },

    // ESLint
    eslint: {
        ignoreDuringBuilds: false,
    },
};

module.exports = nextConfig;
