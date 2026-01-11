import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    GROQ_API_KEY: process.env.GROQ_API_KEY || '',
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY || '',
  },
};

export default nextConfig;
