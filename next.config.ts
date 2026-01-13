import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Environment variables are automatically loaded from .env files
  // NEXT_PUBLIC_* variables are exposed to the browser
  // Other variables (like GROQ_API_KEY, TURNSTILE_SECRET_KEY) remain server-side only
};

export default nextConfig;
