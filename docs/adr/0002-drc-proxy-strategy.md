# ADR 0002: DRC Proxy Strategy

Date: 2025-10-08

## Status

Accepted

## Context

The platform needs to integrate with DRC (Design Rule Check) services for validation and processing of engineering designs. The DRC service is a separate microservice that requires:

- Request routing and load balancing
- Error handling and retry logic
- Request/response transformation
- Authentication forwarding
- Performance monitoring

Key considerations:
- DRC service may be unreliable or slow
- Need to handle various error conditions (timeouts, 5xx, 4xx)
- Request tracing and observability requirements
- Content negotiation and validation
- Upstream service resilience

## Decision

Implement a comprehensive proxy strategy for DRC requests through the API Gateway:

1. **Dedicated route handling**: `/v1/drc/*` routes proxied to DRC service
2. **Request ID propagation**: Forward `x-request-id` headers for tracing
3. **Retry logic**: Jittered exponential backoff for 5xx errors and timeouts, no retry for 4xx
4. **Content negotiation**: Enforce JSON content-type and Accept headers
5. **Error handling**: Proper HTTP status code mapping and error responses
6. **Observability**: OpenTelemetry spans and structured logging for metrics
7. **Load balancing**: Round-robin distribution across DRC service instances

The proxy will be implemented as a Fastify route handler with comprehensive middleware for validation, retry logic, and monitoring.

## Consequences

### Positive
- Centralized DRC integration point
- Robust error handling and retry logic
- Full request tracing and observability
- Consistent API contract for clients
- Improved resilience against DRC service issues

### Negative
- Additional complexity in API Gateway
- Potential performance overhead from proxying
- Dependency on DRC service availability
- Need to maintain proxy logic as DRC API evolves

### Risks and Mitigations
- **Service coupling**: Versioned API contracts and comprehensive testing
- **Performance impact**: Caching strategies and async processing where appropriate
- **Error masking**: Detailed error logging and client error transparency
- **Scalability**: Horizontal scaling of API Gateway instances

## References

- API Gateway DRC routes in `services/api-gateway/src/routes/drc.ts`
- HTTP utilities with retry logic in `services/api-gateway/src/http.ts`
- Content negotiation implementation
- OpenTelemetry integration for observability