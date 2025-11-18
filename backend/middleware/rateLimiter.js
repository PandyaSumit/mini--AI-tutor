import rateLimit from 'express-rate-limit';

// General API rate limiter
const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 250, // Limit each IP to 250 requests per windowMs (raised slightly to avoid accidental dev blocks)
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes'
    },
    // Skip rate limiting for requests that include an Authorization header
    // (authenticated users will be rate-limited per-account elsewhere)
    skip: (req) => {
        // Always skip health checks
        if (req.path === '/api/health' || req.path === '/ready') return true;

        // If an Authorization header exists, skip the global IP-based limiter
        if (req.headers && req.headers.authorization) return true;

        return false;
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiter for authentication routes
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for AI chat (to prevent API abuse)
export const chatLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // Limit each IP to 20 chat messages per minute
    message: {
        success: false,
        message: 'Too many messages, please slow down'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export default rateLimiter;
