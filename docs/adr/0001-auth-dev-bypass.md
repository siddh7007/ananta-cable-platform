# ADR 0001: Authentication Development Bypass

Date: 2025-10-08

## Status

Accepted

## Context

During development and testing, full authentication flows can be cumbersome and slow down the development process. The platform needs a way to bypass authentication for development environments while maintaining security in production.

Key requirements:

- Easy development workflow
- No security compromises in production
- Clear separation between dev and prod environments
- Minimal impact on application architecture

## Decision

Implement an authentication bypass mechanism that:

1. **Environment-based activation**: Only active when `NODE_ENV=development` or `AUTH_BYPASS=true`
2. **Mock user injection**: Injects a mock user object with development credentials
3. **Request header trigger**: Activated via `X-Auth-Bypass: true` header
4. **Logging**: Clearly logs when bypass is used for audit purposes
5. **Production safety**: Completely disabled in production environments

The bypass will be implemented at the authentication middleware level, allowing developers to work with authenticated contexts without going through full OAuth flows.

## Consequences

### Positive

- Significantly faster development iteration cycles
- Easier testing of authenticated features
- No changes required to application business logic
- Clear audit trail of bypass usage

### Negative

- Potential for developers to forget bypass is active
- Risk of bypass logic accidentally leaking to production (mitigated by environment checks)
- Additional complexity in authentication middleware

### Risks and Mitigations

- **Production leakage**: Multiple environment checks and production deployment validation
- **Security bypass abuse**: Limited to development environments, logged usage
- **Testing confusion**: Clear logging and environment indicators

## References

- Authentication service implementation in `services/auth/`
- API Gateway authentication middleware
- Development environment setup documentation
