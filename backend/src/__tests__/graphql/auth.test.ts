import {
  getPrismaClient,
  createTestUser,
  cleanDatabase,
  createGraphQLTestClient,
  createGraphQLAuthenticatedClient
} from '../helpers/graphqlTestUtils';

describe('GraphQL Authentication', () => {
  let testClient: any;

  beforeEach(async () => {
    await cleanDatabase();
    testClient = await createGraphQLTestClient();
  });

  afterEach(async () => {
    if (testClient) {
      await testClient.cleanup();
    }
  });

  describe('register mutation', () => {
    it('should register a new user successfully', async () => {
      const mutation = `
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

      const variables = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User'
      };

      const response = await testClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.register).toBeDefined();
      expect(response.body.data.register.token).toBeDefined();
      expect(response.body.data.register.user.username).toBe('testuser');
      expect(response.body.data.register.user.email).toBe('test@example.com');
      expect(response.body.data.register.user.name).toBe('Test User');
      expect(response.body.data.register.user.role).toBe('USER');
      expect(response.body.data.register.user.isActive).toBe(true);
    });

    it('should reject registration with invalid email', async () => {
      const mutation = `
        mutation Register($username: String!, $email: String!, $password: String!) {
          register(username: $username, email: $email, password: $password) {
            token
            user {
              id
              username
              email
            }
          }
        }
      `;

      const variables = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'SecurePass123!'
      };

      const response = await testClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Invalid Email Format');
    });

    it('should reject registration with weak password', async () => {
      const mutation = `
        mutation Register($username: String!, $email: String!, $password: String!) {
          register(username: $username, email: $email, password: $password) {
            token
            user {
              id
              username
              email
            }
          }
        }
      `;

      const variables = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak'
      };

      const response = await testClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Password must be at least 8 characters long');
    });

    it('should reject registration with invalid username', async () => {
      const mutation = `
        mutation Register($username: String!, $email: String!, $password: String!) {
          register(username: $username, email: $email, password: $password) {
            token
            user {
              id
              username
              email
            }
          }
        }
      `;

      const variables = {
        username: 'a', // Too short
        email: 'test@example.com',
        password: 'SecurePass123!'
      };

      const response = await testClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Username must be at least 3 characters long');
    });

    it('should reject duplicate username', async () => {
      // First registration
      const mutation = `
        mutation Register($username: String!, $email: String!, $password: String!) {
          register(username: $username, email: $email, password: $password) {
            token
            user {
              id
              username
              email
            }
          }
        }
      `;

      const variables = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'SecurePass123!'
      };

      await testClient.mutate(mutation, variables);

      // Second registration with same username
      const variables2 = {
        username: 'testuser',
        email: 'test2@example.com',
        password: 'SecurePass123!'
      };

      const response = await testClient.mutate(mutation, variables2);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Username or email already exists');
    });

    it('should reject duplicate email', async () => {
      // First registration
      const mutation = `
        mutation Register($username: String!, $email: String!, $password: String!) {
          register(username: $username, email: $email, password: $password) {
            token
            user {
              id
              username
              email
            }
          }
        }
      `;

      const variables = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'SecurePass123!'
      };

      await testClient.mutate(mutation, variables);

      // Second registration with same email
      const variables2 = {
        username: 'testuser2',
        email: 'test@example.com',
        password: 'SecurePass123!'
      };

      const response = await testClient.mutate(mutation, variables2);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Username or email already exists');
    });
  });

  describe('login mutation', () => {
    beforeEach(async () => {
      // Create a test user
      const user = await createTestUser({
        username: 'testuser',
        email: 'test@example.com',
        password: '$2b$10$test.hash.for.testing', // Mock hash
        role: 'USER',
        isActive: true
      });

      // Mock AuthService.login to return success
      const { AuthService } = require('../../services/AuthService');
      jest.spyOn(AuthService, 'login').mockResolvedValue({
        token: 'mock-jwt-token',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        }
      });
    });

    it('should login successfully with correct credentials', async () => {
      const mutation = `
        mutation Login($username: String!, $password: String!) {
          login(username: $username, password: $password) {
            token
            user {
              id
              username
              email
              role
              isActive
            }
          }
        }
      `;

      const variables = {
        username: 'testuser',
        password: 'SecurePass123!'
      };

      const response = await testClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.login).toBeDefined();
      expect(response.body.data.login.token).toBe('mock-jwt-token');
      expect(response.body.data.login.user.username).toBe('testuser');
    });

    it('should reject login with incorrect username', async () => {
      // Mock AuthService.login to throw error for wrong username
      const { AuthService } = require('../../services/AuthService');
      jest.spyOn(AuthService, 'login').mockRejectedValue(new Error('Invalid credentials'));

      const mutation = `
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

      const variables = {
        username: 'wronguser',
        password: 'SecurePass123!'
      };

      const response = await testClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Invalid credentials');
    });

    it('should reject login with incorrect password', async () => {
      // Mock AuthService.login to throw error for wrong password
      const { AuthService } = require('../../services/AuthService');
      jest.spyOn(AuthService, 'login').mockRejectedValue(new Error('Invalid credentials'));

      const mutation = `
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

      const variables = {
        username: 'testuser',
        password: 'WrongPassword123!'
      };

      const response = await testClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Invalid credentials');
    });

    it('should reject login for inactive user', async () => {
      // Create inactive user
      const inactiveUser = await createTestUser({
        username: 'inactiveuser',
        email: 'inactive@example.com',
        password: '$2b$10$test.hash.for.testing',
        role: 'USER',
        isActive: false
      });

      // Mock AuthService.login to throw error for inactive user
      const { AuthService } = require('../../services/AuthService');
      jest.spyOn(AuthService, 'login').mockRejectedValue(new Error('Account is inactive'));

      const mutation = `
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

      const variables = {
        username: 'inactiveuser',
        password: 'SecurePass123!'
      };

      const response = await testClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Account is inactive');
    });
  });

  describe('me query', () => {
    it('should return current user when authenticated', async () => {
      // Create a test user
      const user = await createTestUser({
        username: 'testuser',
        email: 'test@example.com',
        password: '$2b$10$test.hash.for.testing',
        role: 'USER',
        isActive: true
      });

      // Create authenticated client
      const authClient = await createGraphQLAuthenticatedClient(user.id);

      const query = `
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

      const response = await authClient.query(query);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.me).toBeDefined();
      expect(response.body.data.me.id).toBe(user.id);
      expect(response.body.data.me.username).toBe('testuser');
      expect(response.body.data.me.email).toBe('test@example.com');

      await authClient.cleanup();
    });

    it('should reject when not authenticated', async () => {
      const query = `
        query Me {
          me {
            id
            username
            email
          }
        }
      `;

      const response = await testClient.query(query);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Authentication required');
    });
  });
}); 