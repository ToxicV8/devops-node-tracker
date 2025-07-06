import { getPrismaClient, cleanDatabase } from '../helpers/graphqlTestUtils';
import { createTestClient } from '../helpers/testClient';

describe('App Integration', () => {
  let testClient: any;

  beforeAll(async () => {
    await cleanDatabase();
    testClient = await createTestClient();
  });

  afterAll(async () => {
    if (testClient) {
      await testClient.cleanup();
    }
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await testClient.app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).status).toBe('ok');
    });
  });

  describe('GraphQL Schema', () => {
    it('should have valid schema', async () => {
      const query = `
        query IntrospectionQuery {
          __schema {
            types {
              name
            }
          }
        }
      `;

      const response = await testClient.query(query);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.__schema).toBeDefined();
      expect(response.body.data.__schema.types).toBeDefined();
      
      // Check for expected types
      const typeNames = response.body.data.__schema.types.map((t: any) => t.name);
      expect(typeNames).toContain('Query');
      expect(typeNames).toContain('Mutation');
      expect(typeNames).toContain('User');
      expect(typeNames).toContain('Project');
    });
  });

  describe('Authentication Flow', () => {
    it('should handle registration and login flow', async () => {
      // Register a new user
      const registerMutation = `
        mutation Register($username: String!, $email: String!, $password: String!, $name: String) {
          register(username: $username, email: $email, password: $password, name: $name) {
            token
            user {
              id
              username
              email
              name
              role
              isActive
            }
          }
        }
      `;

      const registerVariables = {
        username: 'integrationtest',
        email: 'integration@example.com',
        password: 'SecurePass123!',
        name: 'Integration Test User'
      };

      const registerResponse = await testClient.mutate(registerMutation, registerVariables);

      expect(registerResponse.statusCode).toBe(200);
      expect(registerResponse.body.data).toBeDefined();
      expect(registerResponse.body.data.register).toBeDefined();
      expect(registerResponse.body.data.register.token).toBeDefined();
      expect(registerResponse.body.data.register.user.username).toBe('integrationtest');

      const userId = registerResponse.body.data.register.user.id;
      const token = registerResponse.body.data.register.token;

      // Login with the same credentials
      const loginMutation = `
        mutation Login($username: String!, $password: String!) {
          login(username: $username, password: $password) {
            token
            user {
              id
              username
              email
            }
          }
        }
      `;

      const loginVariables = {
        username: 'integrationtest',
        password: 'SecurePass123!'
      };

      const loginResponse = await testClient.mutate(loginMutation, loginVariables);

      expect(loginResponse.statusCode).toBe(200);
      expect(loginResponse.body.data).toBeDefined();
      expect(loginResponse.body.data.login).toBeDefined();
      expect(loginResponse.body.data.login.token).toBeDefined();
      expect(loginResponse.body.data.login.user.id).toBe(userId);

      // Query user data with token
      const meQuery = `
        query Me {
          me {
            id
            username
            email
            name
            role
            isActive
          }
        }
      `;

      // Create authenticated client
      const authClient = await createTestClient();
      authClient.setAuthToken(token);

      const meResponse = await authClient.query(meQuery);

      expect(meResponse.statusCode).toBe(200);
      expect(meResponse.body.data).toBeDefined();
      expect(meResponse.body.data.me).toBeDefined();
      expect(meResponse.body.data.me.id).toBe(userId);
      expect(meResponse.body.data.me.username).toBe('integrationtest');

      await authClient.cleanup();
    });
  });

  describe('Database Connection', () => {
    it('should have working database connection', async () => {
      const prisma = getPrismaClient();
      
      // Test database connection by creating and reading a test record
      const testUser = await prisma.user.create({
        data: {
          username: 'db_test_user',
          email: 'dbtest@example.com',
          password: 'hashedpassword',
          role: 'USER',
          isActive: true
        }
      });

      expect(testUser).toBeDefined();
      expect(testUser.username).toBe('db_test_user');

      // Clean up
      await prisma.user.delete({
        where: { id: testUser.id }
      });
    });
  });
}); 