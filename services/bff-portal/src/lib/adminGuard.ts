import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Admin guard middleware
 * Checks if user has admin role or if dev bypass is enabled
 */
export async function adminGuard(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
  const devBypass = (process.env.DEV_AUTH_BYPASS ?? 'false') === 'true';

  if (devBypass) {
    return true;
  }

  // In production, check user roles from auth
  // For now, we'll assume auth middleware sets user info
  // This would be enhanced with proper JWT validation
  const user = (request as any).user;

  if (!user || !user.roles || !Array.isArray(user.roles)) {
    reply.code(403).send({
      error: 'Forbidden',
      message: 'Admin access required',
    });
    return false;
  }

  if (!user.roles.includes('admin')) {
    reply.code(403).send({
      error: 'Forbidden',
      message: 'Admin access required',
    });
    return false;
  }

  return true;
}
