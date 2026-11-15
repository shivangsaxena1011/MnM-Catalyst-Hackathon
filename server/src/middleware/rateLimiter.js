import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter for Authentication and Passcode endpoints
 * Limits to 15 requests per 15 minutes per IP to prevent brute-force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. For security reasons, please try again in 15 minutes.',
  },
});

/**
 * Rate Limiter for Joining Care Circles via Invite Code
 * Prevents automated enumeration of invite codes (e.g. SAATHI-XXXX)
 */
export const joinRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 code verification attempts per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many Care Circle join attempts. Please wait 15 minutes before trying again.',
  },
});

/**
 * General API Rate Limiter
 */
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 150, // 150 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});
