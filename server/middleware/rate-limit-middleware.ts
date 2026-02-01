import rateLimit from "express-rate-limit";

export const globalLimiter = rateLimit({
  windowMs: 60 * 1 * 1000, // 1 minute
  max: 150, // 100 requests per IP per window

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    error: "RATE_LIMIT_EXCEEDED",
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 8, // only 8 attempts

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    error: "AUTH_RATE_LIMIT_EXCEEDED",
  },
});
