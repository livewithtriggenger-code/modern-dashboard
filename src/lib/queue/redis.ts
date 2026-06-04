import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || "";
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || "";

// Initialize standard Redis client. 
// If environment variables are missing (local testing), it will fail gracefully or you can mock it.
export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});
