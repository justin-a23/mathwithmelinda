import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    MWM_ACCESS_KEY_ID: process.env.MWM_ACCESS_KEY_ID,
    MWM_SECRET_ACCESS_KEY: process.env.MWM_SECRET_ACCESS_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  },
};

export default nextConfig;
