import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    MWM_ACCESS_KEY_ID: process.env.MWM_ACCESS_KEY_ID,
    MWM_SECRET_ACCESS_KEY: process.env.MWM_SECRET_ACCESS_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ZOOM_ACCOUNT_ID: process.env.ZOOM_ACCOUNT_ID,
    ZOOM_CLIENT_ID: process.env.ZOOM_CLIENT_ID,
    ZOOM_CLIENT_SECRET: process.env.ZOOM_CLIENT_SECRET,
    SES_SMTP_USERNAME: process.env.SES_SMTP_USERNAME,
    SES_SMTP_PASSWORD: process.env.SES_SMTP_PASSWORD,
    SES_FROM_EMAIL: process.env.SES_FROM_EMAIL,
  },
};

export default nextConfig;
