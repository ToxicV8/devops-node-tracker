import fastify from "fastify";
import mercurius from "mercurius";
import { resolvers } from './graphql/resolvers';
import { readFileSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';
import { AuthService } from './services/AuthService';

// Load Schema
const schema = readFileSync(join(__dirname, '../graphql', 'schema.graphql'), 'utf8');

const app = fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info'
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
      app.log.warn('Authentication failed:', error);
      return { user: null };
    }
  }
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '4000');
    const host = process.env.HOST || '0.0.0.0';
    
    await app.listen({ 
      port, 
      host 
    });
    
    console.log(`🚀 Server is running at http://${host}:${port}`);
    console.log(`📊 GraphiQL available at http://${host}:${port}/graphiql`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

// Graceful Shutdown
const shutdown = async (signal: string) => {
  console.log(`${signal} received. Server is shutting down...`);
  await app.close();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();

