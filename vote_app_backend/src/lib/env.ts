import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    PORT: z.string().default("8080"),
    FRONTEND_URL : z.string().min(1),
    NODE_ENV :z.string(),
    BETTER_AUTH_URL: z.string(),
    EMAIL_FROM : z.string().min(1),
    RESEND_API_KEY : z.string().min(1),
    BETTER_AUTH_SECRET : z.string(),
    FEDAPAY_SECRET_KEY: z.string().min(1),
    FEDAPAY_WEBHOOK_SECRET: z.string().min(1),
    FEDAPAY_PREMIUM_AMOUNT: z.string().default("5000"),
    FEDAPAY_ENVIRONMENT : z.string().min(1), 
    DATABASE_URL : z.string().min(1), 
    ARCJET_KEY : z.string().min(1), 
    ARCJET_ENV : z.string().min(1), 
    R2_ACCESS_KEY_ID : z.string().min(1), 
    R2_SECRET_ACCESS_KEY : z.string().min(1), 
    R2_BUCKET_NAME : z.string().min(1), 
    R2_PUBLIC_URL : z.string().min(1), 
    R2_ACCOUNT_ID : z.string().min(1),
  },
  runtimeEnv: process.env
});