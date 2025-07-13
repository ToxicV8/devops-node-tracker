import fastify from "fastify";
import mercurius from "mercurius";
import { resolvers } from './graphql/resolvers';
import { readFileSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';
import { AuthService } from './services/AuthService';

// Load Schema
const schema = readFileSync(join(__dirname, 'graphql', 'schema.graphql'), 'utf8');

// Export function to create app for testing
export async function createApp() {
  const app = fastify({
    logger: process.env.NODE_ENV === 'test' ? false : {
      level: process.env.LOG_LEVEL || 'info'
    }
  });

  // Security Headers (Helmet) - Completely disabled for GraphiQL in development
  if (process.env.NODE_ENV === 'production') {
    app.register(require('@fastify/helmet'), {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    });
  }
  // In development: No Helmet at all to allow GraphiQL CDN resources

  // CORS Configuration
  app.register(require('@fastify/cors'), {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-Total-Count'],
  });

  // Rate Limiting
  app.register(require('@fastify/rate-limit'), {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    timeWindow: `${process.env.RATE_LIMIT_WINDOW || '15'} minutes`,
    errorResponseBuilder: (_: any, context: any) => ({
      code: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded, retry in ${context.after}`,
      retryAfter: context.after
    }),
    // Different limits for different endpoints
    keyGenerator: (request: any) => {
      // Use IP address as base
      const ip = request.ip || request.socket.remoteAddress || 'unknown';
      
      // For GraphQL, also use User-ID if available
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const payload = AuthService.verifyToken(token);
          return `${ip}-${payload.userId}`;
        } catch {
          // Token invalid, use only IP
          return ip;
        }
      }
      
      return ip;
    },
    // Different limits for different routes
    skipOnError: false,
    // Whitelist for Health Check
    skip: (request: any) => {
      return request.url === '/health';
    }
  });

  // Health Check Endpoint
  app.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // GraphQL Setup
  app.register(mercurius, {
    schema,
    resolvers,
    graphiql: process.env.NODE_ENV !== 'production',
    ide: process.env.NODE_ENV !== 'production',
    context: async (request, reply) => {
      // Extract JWT from Authorization header
      const authHeader = request.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { user: null };
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      try {
        const user = await AuthService.getUserFromToken(token);
        return { user };
      } catch (error) {
        // Log error but don't fail request - let resolvers handle authentication
        if (process.env.NODE_ENV !== 'test') {
          app.log.warn('Authentication failed:', error);
        }
        return { user: null };
      }
    }
  });

  return app;
}

// Start server if this file is run directly
if (require.main === module) {
  const start = async () => {
    try {
      const app = await createApp();
      const port = parseInt(process.env.PORT || '4000');
      const host = process.env.HOST || '0.0.0.0';
      
      await app.listen({ 
        port, 
        host 
      });
      
      console.log(`🚀 Server is running at http://${host}:${port}`);
      console.log(`📊 GraphQL endpoint: http://${host}:${port}/graphql`);
      console.log(`🔍 GraphiQL IDE: http://${host}:${port}/graphiql`);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  };

  // Graceful Shutdown
  const shutdown = async (signal: string) => {
    console.log(`${signal} received. Server is shutting down...`);
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  start();
}

