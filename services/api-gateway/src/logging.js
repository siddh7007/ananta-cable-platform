import { randomUUID } from 'crypto';
import { trace } from '@opentelemetry/api';
export function getLoggerConfig(env = process.env) {
    const level = env.LOG_LEVEL || 'info';
    const sampling = env.LOG_SAMPLING ? parseFloat(env.LOG_SAMPLING) : 1;
    const maxBodySize = env.LOG_MAX_BODY ? parseInt(env.LOG_MAX_BODY, 10) : 4096;
    // Default redactions
    const defaultRedactHeaders = ['authorization', 'cookie', 'set-cookie'];
    const defaultRedactFields = ['password', 'token', 'access_token', 'refresh_token', 'secret', 'client_secret'];
    // Extend with environment variables
    const additionalHeaders = (env.LOG_REDACT_HEADERS || '').split(',').map(h => h.trim()).filter(Boolean);
    const additionalFields = (env.LOG_REDACT_FIELDS || '').split(',').map(f => f.trim()).filter(Boolean);
    const allRedactHeaders = [...defaultRedactHeaders, ...additionalHeaders];
    const allRedactFields = [...defaultRedactFields, ...additionalFields];
    // Build pino redact paths
    const redactPaths = [];
    // Headers
    allRedactHeaders.forEach(header => {
        redactPaths.push(`req.headers.${header}`);
        redactPaths.push(`req.raw.headers.${header}`);
        redactPaths.push(`res.headers.${header}`);
    });
    // Body fields (nested paths)
    allRedactFields.forEach(field => {
        redactPaths.push(`req.body.${field}`);
        redactPaths.push(`req.body.*.${field}`);
        redactPaths.push(`req.body.*.*.${field}`);
        redactPaths.push(`res.body.${field}`);
        redactPaths.push(`res.body.*.${field}`);
        redactPaths.push(`res.body.*.*.${field}`);
    });
    const config = {
        level,
        redact: {
            paths: redactPaths,
            censor: '[REDACTED]'
        },
        base: {
            service: 'api-gateway',
            env: env.NODE_ENV || 'development'
        },
        maxBodySize
    };
    if (sampling < 1) {
        config.sampling = sampling;
    }
    return config;
}
export function attachRequestLogging(fastify) {
    const logger = fastify.log;
    const config = getLoggerConfig();
    // Store request start time and sizes
    fastify.addHook('onRequest', (req, reply, done) => {
        // Ensure/propagate x-request-id
        const requestId = req.headers['x-request-id'] || randomUUID();
        req.headers['x-request-id'] = requestId;
        reply.header('x-request-id', requestId);
        // Add trace headers if tracing is active
        const activeSpan = trace.getActiveSpan();
        if (activeSpan) {
            const spanContext = activeSpan.spanContext();
            if (spanContext.traceId) {
                reply.header('x-trace-id', spanContext.traceId);
            }
        }
        // Store start time
        req.startTime = process.hrtime.bigint();
        // Log request start
        logger.info({
            event: 'req_start',
            id: requestId,
            method: req.method,
            url: req.url,
            ip: req.ip
        });
        done();
    });
    // Capture response size on send
    fastify.addHook('onSend', (req, reply, payload, done) => {
        if (typeof payload === 'string') {
            req.resSize = Buffer.byteLength(payload, 'utf8');
        }
        else if (Buffer.isBuffer(payload)) {
            req.resSize = payload.length;
        }
        done();
    });
    // Log request end with timing and sizes
    fastify.addHook('onResponse', (req, reply, done) => {
        const requestId = req.headers['x-request-id'];
        const startTime = req.startTime;
        const latencyNs = process.hrtime.bigint() - startTime;
        const latencyMs = Number(latencyNs) / 1000000; // Convert to milliseconds
        // Estimate request size (headers + body)
        let reqSize = 0;
        if (req.body) {
            if (typeof req.body === 'string') {
                reqSize = Buffer.byteLength(req.body, 'utf8');
            }
            else {
                reqSize = Buffer.byteLength(JSON.stringify(req.body), 'utf8');
            }
        }
        // Truncate if too large
        if (reqSize > config.maxBodySize) {
            reqSize = config.maxBodySize;
        }
        const resSize = req.resSize || 0;
        logger.info({
            event: 'req_end',
            id: requestId,
            method: req.method,
            url: req.url,
            statusCode: reply.statusCode,
            latency_ms: Math.round(latencyMs * 100) / 100,
            req_size: reqSize,
            res_size: resSize
        });
        done();
    });
    // Enhanced error logging
    fastify.setErrorHandler((error, req, reply) => {
        const requestId = req.headers['x-request-id'] || 'unknown';
        logger.error({
            event: 'error',
            id: requestId,
            err: {
                code: error.code,
                message: error.message
            },
            stack: config.level === 'debug' ? error.stack : undefined
        });
        // Return existing error response
        reply.code(error.statusCode || 500).send({
            error: error.code || 'INTERNAL_SERVER_ERROR',
            message: error.message
        });
    });
}
