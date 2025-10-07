import { trace, SpanStatusCode } from '@opentelemetry/api';
export async function initOtelIfEnabled() {
    // Only initialize if explicitly enabled
    if (process.env.OTEL_ENABLED !== 'true') {
        return;
    }
    try {
        // Dynamic imports to avoid requiring packages when disabled
        const { NodeSDK } = await import('@opentelemetry/sdk-node');
        const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node');
        const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
        const { resourceFromAttributes } = await import('@opentelemetry/resources');
        const { TraceIdRatioBasedSampler } = await import('@opentelemetry/sdk-trace-base');
        // Build resource attributes
        const resourceAttributes = {
            'service.name': 'api-gateway',
            'service.version': process.env.GIT_SHA || 'dev',
            'deployment.environment': process.env.NODE_ENV || 'development'
        };
        // Add any additional resource attributes from env
        if (process.env.OTEL_RESOURCE_ATTRIBUTES) {
            const additionalAttrs = process.env.OTEL_RESOURCE_ATTRIBUTES.split(',');
            for (const attr of additionalAttrs) {
                const [key, value] = attr.split('=');
                if (key && value) {
                    resourceAttributes[key.trim()] = value.trim();
                }
            }
        }
        // Create resource
        const resource = resourceFromAttributes(resourceAttributes);
        // Configure exporter
        const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4318';
        const exporter = new OTLPTraceExporter({
            url: `${endpoint}/v1/traces`
        });
        // Configure sampling
        const samplerArg = parseFloat(process.env.OTEL_TRACES_SAMPLER_ARG || '1');
        const sampler = new TraceIdRatioBasedSampler(samplerArg);
        // Initialize SDK
        const sdk = new NodeSDK({
            resource,
            traceExporter: exporter,
            instrumentations: [getNodeAutoInstrumentations()],
            sampler
        });
        // Start SDK
        sdk.start();
        // Handle graceful shutdown
        const shutdown = () => {
            sdk.shutdown().catch(console.error);
        };
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
        console.log('[otel] OpenTelemetry tracing initialized');
    }
    catch (error) {
        console.warn('[otel] packages not installed; tracing disabled. Run: pnpm add -w @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http');
    }
}
export async function withChildSpan(name, attrs, fn) {
    const tracer = trace.getTracer('api-gateway', '1.0.0');
    const span = tracer.startSpan(name);
    // Set initial attributes
    for (const [key, value] of Object.entries(attrs)) {
        if (value !== undefined) {
            span.setAttribute(key, value);
        }
    }
    try {
        const result = await fn();
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
    }
    catch (error) {
        span.recordException(error);
        span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
    finally {
        span.end();
    }
}
