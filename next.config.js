/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ['@sanity/client', '@sanity/image-url'],
    /* config options here */
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "cdn.sanity.io"
            },
            {
                protocol: "https",
                hostname: "images.unsplash.com"
            },
            {
                protocol: "https",
                hostname: "i.scdn.co"
            },
            {
                protocol: "https",
                hostname: "kgwxlzocwejlqaolecbf.supabase.co"
            }
        ],
    },
    env: {
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
        GOOGLE_PLACE_ID: process.env.GOOGLE_PLACE_ID,
        SANITY_API_TOKEN: process.env.SANITY_API_TOKEN,
        SANITY_API_READ_TOKEN: process.env.SANITY_API_READ_TOKEN,
        RESEND_API_KEY: process.env.RESEND_API_KEY,
        HCAPTCHA_SECRET: process.env.HCAPTCHA_SECRET,
        RESEND_AUDIENCE_ID: process.env.RESEND_AUDIENCE_ID,
        SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
        ADMIN_EMAIL: process.env.ADMIN_EMAIL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    productionBrowserSourceMaps: false,


}

module.exports = nextConfig