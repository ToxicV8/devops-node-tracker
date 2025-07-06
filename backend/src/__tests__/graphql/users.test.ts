import {
  getPrismaClient,
  createTestUser,
  cleanDatabase,
  createGraphQLTestClient,
  createGraphQLAuthenticatedClient
} from '../helpers/graphqlTestUtils';

describe('GraphQL Users', () => {
  let testClient: any;
  let authClient: any;
  let testUser: any;

  beforeEach(async () => {
    await cleanDatabase();
    testClient = await createGraphQLTestClient();
    
    // Create test user
    testUser = await createTestUser({
      username: 'testuser',
      email: 'test@example.com',
      password: '$2b$10$test.hash.for.testing',
      role: 'USER',
      isActive: true
    });

    // Create authenticated client
    authClient = await createGraphQLAuthenticatedClient(testUser.id);
  });

  afterEach(async () => {
    if (testClient) {
      await testClient.cleanup();
    }
    if (authClient) {
      await authClient.cleanup();
    }
  });

  describe('users query', () => {
    let adminUser: any;
    let adminClient: any;

    beforeEach(async () => {
      // Create admin user for users query
      adminUser = await createTestUser({
        username: 'adminuser',
        email: 'admin@example.com',
        password: '$2b$10$test.hash.for.testing',
        role: 'ADMIN',
        isActive: true
      });

      // Create authenticated admin client
      adminClient = await createGraphQLAuthenticatedClient(adminUser.id);

      // Create multiple test users
      await createTestUser({ username: 'user1', email: 'user1@example.com' });
      await createTestUser({ username: 'user2', email: 'user2@example.com' });
      await createTestUser({ username: 'user3', email: 'user3@example.com' });
    });

    afterEach(async () => {
      if (adminClient) {
        await adminClient.cleanup();
      }
    });

    it('should return all users', async () => {
      const query = `
        query Users {
          users {
            id
            username
            email
            name
            role
            isActive
            createdAt
            updatedAt
          }
        }
      `;

      const response = await adminClient.query(query);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.users).toBeDefined();
      expect(response.body.data.users.length).toBeGreaterThanOrEqual(4); // Including testUser
      expect(response.body.data.users[0].username).toBeDefined();
      expect(response.body.data.users[0].email).toBeDefined();
    });

    it('should reject query without authentication', async () => {
      const query = `
        query Users {
          users {
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

  describe('user query', () => {
    it('should return specific user by ID', async () => {
      const query = `
        query User($id: ID!) {
          user(id: $id) {
            id
            username
            email
            name
            role
            isActive
            createdAt
            updatedAt
          }
        }
      `;

      const variables = {
        id: testUser.id
      };

      const response = await authClient.query(query, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.id).toBe(testUser.id);
      expect(response.body.data.user.username).toBe('testuser');
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should return null for non-existent user', async () => {
      const query = `
        query User($id: ID!) {
          user(id: $id) {
            id
            username
            email
          }
        }
      `;

      const variables = {
        id: 'clx1234567890123456789012' // Valid CUID format but non-existent
      };

      const response = await authClient.query(query, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toBeNull();
    });
  });

  describe('updateUser mutation', () => {
    it('should update user successfully', async () => {
      const mutation = `
        mutation UpdateUser($id: ID!, $name: String, $email: String) {
          updateUser(id: $id, name: $name, email: $email) {
            id
            username
            email
            name
            updatedAt
          }
        }
      `;

      const variables = {
        id: testUser.id,
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const response = await authClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.updateUser).toBeDefined();
      expect(response.body.data.updateUser.id).toBe(testUser.id);
      expect(response.body.data.updateUser.name).toBe('Updated Name');
      expect(response.body.data.updateUser.email).toBe('updated@example.com');
    });

    it('should reject update for non-existent user', async () => {
      const mutation = `
        mutation UpdateUser($id: ID!, $name: String, $email: String) {
          updateUser(id: $id, name: $name, email: $email) {
            id
            username
            email
            name
          }
        }
      `;

      const variables = {
        id: 'clx1234567890123456789012', // Valid CUID format but non-existent
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const response = await authClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('User not found');
    });

    it('should reject update with invalid email', async () => {
      const mutation = `
        mutation UpdateUser($id: ID!, $name: String, $email: String) {
          updateUser(id: $id, name: $name, email: $email) {
            id
            username
            email
            name
          }
        }
      `;

      const variables = {
        id: testUser.id,
        name: 'Updated Name',
        email: 'invalid-email'
      };

      const response = await authClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Invalid Email Format');
    });
  });

  describe('deleteUser mutation', () => {
    let adminUser: any;
    let adminClient: any;

    beforeEach(async () => {
      // Create admin user for delete tests
      adminUser = await createTestUser({
        username: 'adminuser',
        email: 'admin@example.com',
        password: '$2b$10$test.hash.for.testing',
        role: 'ADMIN',
        isActive: true
      });

      // Create authenticated admin client
      adminClient = await createGraphQLAuthenticatedClient(adminUser.id);
    });

    afterEach(async () => {
      if (adminClient) {
        await adminClient.cleanup();
      }
    });

    it('should delete user successfully', async () => {
      const mutation = `
        mutation DeleteUser($id: ID!) {
          deleteUser(id: $id)
        }
      `;

      const variables = {
        id: testUser.id
      };

      const response = await adminClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.deleteUser).toBe(true);

      // Verify user is deleted
      const prisma = getPrismaClient();
      const deletedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      expect(deletedUser).toBeNull();
    });

    it('should reject deletion of non-existent user', async () => {
      const mutation = `
        mutation DeleteUser($id: ID!) {
          deleteUser(id: $id)
        }
      `;

      const variables = {
        id: 'clx1234567890123456789012' // Valid CUID format but non-existent
      };

      const response = await adminClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('User not found');
    });
  });
}); 