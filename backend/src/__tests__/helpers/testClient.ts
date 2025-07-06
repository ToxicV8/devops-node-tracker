import { createApp } from '../../index';
import { getPrismaClient } from './graphqlTestUtils';
import { AuthService } from '../../services/AuthService';

export class TestClient {
  private app: any;
  private authToken: string | null = null;

  constructor() {
    // Use global PrismaClient instead of creating new instance
  }

  /**
   * Initialize the test client
   */
  async init() {
    this.app = await createApp();
    return this;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string) {
    this.authToken = token;
  }

  /**
   * Create and set auth token for a user
   */
  async loginAsUser(userId: string) {
    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    
    const token = AuthService.generateToken(user.id, user.role);
    this.setAuthToken(token);
    return token;
  }

  /**
   * Execute GraphQL query
   */
  async query(query: string, variables?: any) {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const response = await this.app.inject({
      method: 'POST',
      url: '/graphql',
      headers,
      payload: {
        query,
        variables,
      },
    });

    return {
      statusCode: response.statusCode,
      body: JSON.parse(response.body),
    };
  }

  /**
   * Execute GraphQL mutation
   */
  async mutate(mutation: string, variables?: any) {
    return this.query(mutation, variables);
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    // No need to disconnect Prisma as it's handled globally
  }

  /**
   * Get Prisma client for direct database access
   */
  getPrisma() {
    return getPrismaClient();
  }
}

/**
 * Create a test client with authentication
 */
export async function createAuthenticatedClient(userId: string) {
  const client = new TestClient();
  await client.init();
  await client.loginAsUser(userId);
  return client;
}

/**
 * Create a test client without authentication
 */
export async function createTestClient() {
  const client = new TestClient();
  await client.init();
  return client;
} 