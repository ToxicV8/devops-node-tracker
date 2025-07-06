import {
  getPrismaClient,
  createTestUser,
  createTestProject,
  cleanDatabase,
  createGraphQLTestClient,
  createGraphQLAuthenticatedClient
} from '../helpers/graphqlTestUtils';

describe('GraphQL Projects', () => {
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

  describe('createProject mutation', () => {
    let adminUser: any;
    let adminClient: any;

    beforeEach(async () => {
      // Create admin user for project creation
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

    it('should create a new project successfully', async () => {
      const mutation = `
        mutation CreateProject($name: String!, $description: String) {
          createProject(name: $name, description: $description) {
            id
            name
            description
            createdAt
            updatedAt
          }
        }
      `;

      const variables = {
        name: 'Test Project',
        description: 'A test project description'
      };

      const response = await adminClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.createProject).toBeDefined();
      expect(response.body.data.createProject.name).toBe('Test Project');
      expect(response.body.data.createProject.description).toBe('A test project description');
      expect(response.body.data.createProject.id).toBeDefined();
      expect(response.body.data.createProject.createdAt).toBeDefined();
      expect(response.body.data.createProject.updatedAt).toBeDefined();
    });

    it('should reject project creation without authentication', async () => {
      const mutation = `
        mutation CreateProject($name: String!, $description: String) {
          createProject(name: $name, description: $description) {
            id
            name
            description
          }
        }
      `;

      const variables = {
        name: 'Test Project',
        description: 'A test project description'
      };

      const response = await testClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Authentication required');
    });

    it('should reject project creation with empty name', async () => {
      const mutation = `
        mutation CreateProject($name: String!, $description: String) {
          createProject(name: $name, description: $description) {
            id
            name
            description
          }
        }
      `;

      const variables = {
        name: '',
        description: 'A test project description'
      };

      const response = await adminClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Project Name is required');
    });
  });

  describe('updateProject mutation', () => {
    let testProject: any;
    let adminUser: any;
    let adminClient: any;

    beforeEach(async () => {
      // Create admin user for project updates
      adminUser = await createTestUser({
        username: 'adminuser',
        email: 'admin@example.com',
        password: '$2b$10$test.hash.for.testing',
        role: 'ADMIN',
        isActive: true
      });

      // Create authenticated admin client
      adminClient = await createGraphQLAuthenticatedClient(adminUser.id);

      testProject = await createTestProject({
        name: 'Original Project',
        description: 'Original description',
        ownerId: adminUser.id
      });
    });

    afterEach(async () => {
      if (adminClient) {
        await adminClient.cleanup();
      }
    });

    it('should update project successfully', async () => {
      const mutation = `
        mutation UpdateProject($id: ID!, $name: String, $description: String) {
          updateProject(id: $id, name: $name, description: $description) {
            id
            name
            description
            updatedAt
          }
        }
      `;

      const variables = {
        id: testProject.id,
        name: 'Updated Project',
        description: 'Updated description'
      };

      const response = await adminClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.updateProject).toBeDefined();
      expect(response.body.data.updateProject.id).toBe(testProject.id);
      expect(response.body.data.updateProject.name).toBe('Updated Project');
      expect(response.body.data.updateProject.description).toBe('Updated description');
    });

    it('should reject update for non-existent project', async () => {
      const mutation = `
        mutation UpdateProject($id: ID!, $name: String, $description: String) {
          updateProject(id: $id, name: $name, description: $description) {
            id
            name
            description
          }
        }
      `;

      const variables = {
        id: 'clx1234567890123456789012', // Valid CUID format but non-existent
        name: 'Updated Project',
        description: 'Updated description'
      };

      const response = await adminClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Project not found');
    });
  });

  describe('deleteProject mutation', () => {
    let testProject: any;
    let adminUser: any;
    let adminClient: any;

    beforeEach(async () => {
      // Create admin user for project deletion
      adminUser = await createTestUser({
        username: 'adminuser',
        email: 'admin@example.com',
        password: '$2b$10$test.hash.for.testing',
        role: 'ADMIN',
        isActive: true
      });

      // Create authenticated admin client
      adminClient = await createGraphQLAuthenticatedClient(adminUser.id);

      testProject = await createTestProject({
        name: 'Project to Delete',
        description: 'This project will be deleted',
        ownerId: adminUser.id
      });
    });

    afterEach(async () => {
      if (adminClient) {
        await adminClient.cleanup();
      }
    });

    it('should delete project successfully', async () => {
      const mutation = `
        mutation DeleteProject($id: ID!) {
          deleteProject(id: $id)
        }
      `;

      const variables = {
        id: testProject.id
      };

      const response = await adminClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.deleteProject).toBe(true);

      // Verify project is deleted
      const prisma = getPrismaClient();
      const deletedProject = await prisma.project.findUnique({
        where: { id: testProject.id }
      });
      expect(deletedProject).toBeNull();
    });

    it('should reject deletion of non-existent project', async () => {
      const mutation = `
        mutation DeleteProject($id: ID!) {
          deleteProject(id: $id)
        }
      `;

      const variables = {
        id: 'clx1234567890123456789012' // Valid CUID format but non-existent
      };

      const response = await adminClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Project not found');
    });
  });

  describe('projects query', () => {
    let adminUser: any;
    let adminClient: any;

    beforeEach(async () => {
      // Create admin user for projects query
      adminUser = await createTestUser({
        username: 'adminuser',
        email: 'admin@example.com',
        password: '$2b$10$test.hash.for.testing',
        role: 'ADMIN',
        isActive: true
      });

      // Create authenticated admin client
      adminClient = await createGraphQLAuthenticatedClient(adminUser.id);

      // Create multiple test projects
      await createTestProject({ name: 'Project 1', description: 'First project' });
      await createTestProject({ name: 'Project 2', description: 'Second project' });
      await createTestProject({ name: 'Project 3', description: 'Third project' });
    });

    afterEach(async () => {
      if (adminClient) {
        await adminClient.cleanup();
      }
    });

    it('should return all projects', async () => {
      const query = `
        query Projects {
          projects {
            id
            name
            description
            createdAt
            updatedAt
          }
        }
      `;

      const response = await adminClient.query(query);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.projects).toBeDefined();
      expect(response.body.data.projects).toHaveLength(3);
      expect(response.body.data.projects[0].name).toBeDefined();
      expect(response.body.data.projects[0].description).toBeDefined();
    });

    it('should reject query without authentication', async () => {
      const query = `
        query Projects {
          projects {
            id
            name
            description
          }
        }
      `;

      const response = await testClient.query(query);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Authentication required');
    });
  });

  describe('project query', () => {
    let testProject: any;
    let adminUser: any;
    let adminClient: any;

    beforeEach(async () => {
      // Create admin user for project query
      adminUser = await createTestUser({
        username: 'adminuser',
        email: 'admin@example.com',
        password: '$2b$10$test.hash.for.testing',
        role: 'ADMIN',
        isActive: true
      });

      // Create authenticated admin client
      adminClient = await createGraphQLAuthenticatedClient(adminUser.id);

      testProject = await createTestProject({
        name: 'Test Project',
        description: 'Test project description'
      });
    });

    afterEach(async () => {
      if (adminClient) {
        await adminClient.cleanup();
      }
    });

    it('should return specific project by ID', async () => {
      const query = `
        query Project($id: ID!) {
          project(id: $id) {
            id
            name
            description
            createdAt
            updatedAt
          }
        }
      `;

      const variables = {
        id: testProject.id
      };

      const response = await adminClient.query(query, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.project).toBeDefined();
      expect(response.body.data.project.id).toBe(testProject.id);
      expect(response.body.data.project.name).toBe('Test Project');
      expect(response.body.data.project.description).toBe('Test project description');
    });

    it('should return null for non-existent project', async () => {
      const query = `
        query Project($id: ID!) {
          project(id: $id) {
            id
            name
            description
          }
        }
      `;

      const variables = {
        id: 'clx1234567890123456789012' // Valid CUID format but non-existent
      };

      const response = await adminClient.query(query, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.project).toBeNull();
    });
  });
}); 