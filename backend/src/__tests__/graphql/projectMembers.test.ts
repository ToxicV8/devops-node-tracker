import {
  getPrismaClient,
  createTestUser,
  createTestProject,
  cleanDatabase,
  createGraphQLTestClient,
  createGraphQLAuthenticatedClient
} from '../helpers/graphqlTestUtils';

describe('GraphQL Project Members', () => {
  let testClient: any;
  let adminUser: any;
  let projectOwner: any;
  let regularUser: any;
  let adminClient: any;
  let ownerClient: any;
  let userClient: any;
  let project: any;

  beforeEach(async () => {
    await cleanDatabase();
    
    // Create test users
    adminUser = await createTestUser({
      username: 'admin',
      email: 'admin@example.com',
      role: 'ADMIN'
    });

    projectOwner = await createTestUser({
      username: 'owner',
      email: 'owner@example.com',
      role: 'USER'
    });

    regularUser = await createTestUser({
      username: 'user',
      email: 'user@example.com',
      role: 'USER'
    });

    // Create test project
    project = await createTestProject({
      name: 'Test Project',
      ownerId: projectOwner.id
    });

    // Add project owner as OWNER member
    const prisma = getPrismaClient();
    await prisma.projectMember.create({
      data: {
        userId: projectOwner.id,
        projectId: project.id,
        projectRole: 'OWNER'
      }
    });

    // Create test clients
    testClient = await createGraphQLTestClient();
    adminClient = await createGraphQLAuthenticatedClient(adminUser.id);
    ownerClient = await createGraphQLAuthenticatedClient(projectOwner.id);
    userClient = await createGraphQLAuthenticatedClient(regularUser.id);
  });

  afterEach(async () => {
    if (testClient) await testClient.cleanup();
    if (adminClient) await adminClient.cleanup();
    if (ownerClient) await ownerClient.cleanup();
    if (userClient) await userClient.cleanup();
  });

  describe('addProjectMember mutation', () => {
    it('should add project member successfully as admin', async () => {
      const mutation = `
        mutation AddProjectMember($projectId: ID!, $userId: ID!, $projectRole: ProjectRole) {
          addProjectMember(projectId: $projectId, userId: $userId, projectRole: $projectRole) {
            id
            projectRole
            joinedAt
            user {
              id
              username
              email
            }
            project {
              id
              name
            }
          }
        }
      `;

      const variables = {
        projectId: project.id,
        userId: regularUser.id,
        projectRole: 'DEVELOPER'
      };

      const response = await adminClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.addProjectMember).toBeDefined();
      expect(response.body.data.addProjectMember.user.id).toBe(regularUser.id);
      expect(response.body.data.addProjectMember.project.id).toBe(project.id);
      expect(response.body.data.addProjectMember.projectRole).toBe('DEVELOPER');
      expect(response.body.data.addProjectMember.user).toBeDefined();
      expect(response.body.data.addProjectMember.project).toBeDefined();
    });

    it('should add project member successfully as project owner', async () => {
      const mutation = `
        mutation AddProjectMember($projectId: ID!, $userId: ID!, $projectRole: ProjectRole) {
          addProjectMember(projectId: $projectId, userId: $userId, projectRole: $projectRole) {
            id
            projectRole
            joinedAt
            user {
              id
              username
            }
            project {
              id
              name
            }
          }
        }
      `;

      const variables = {
        projectId: project.id,
        userId: regularUser.id,
        projectRole: 'MEMBER'
      };

      const response = await ownerClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.addProjectMember).toBeDefined();
      expect(response.body.data.addProjectMember.user.id).toBe(regularUser.id);
      expect(response.body.data.addProjectMember.projectRole).toBe('MEMBER');
    });

    it('should reject adding member by non-owner non-admin', async () => {
      const mutation = `
        mutation AddProjectMember($projectId: ID!, $userId: ID!, $projectRole: ProjectRole) {
          addProjectMember(projectId: $projectId, userId: $userId, projectRole: $projectRole) {
            id
            projectRole
            user {
              id
            }
            project {
              id
            }
          }
        }
      `;

      const variables = {
        projectId: project.id,
        userId: regularUser.id,
        projectRole: 'DEVELOPER'
      };

      const response = await userClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('No permission to add project members');
    });

    it('should reject adding already existing member', async () => {
      // First add the member
      const prisma = getPrismaClient();
      await prisma.projectMember.create({
        data: {
          userId: regularUser.id,
          projectId: project.id,
          projectRole: 'MEMBER'
        }
      });

      const mutation = `
        mutation AddProjectMember($projectId: ID!, $userId: ID!, $projectRole: ProjectRole) {
          addProjectMember(projectId: $projectId, userId: $userId, projectRole: $projectRole) {
            id
            projectRole
            user {
              id
            }
            project {
              id
            }
          }
        }
      `;

      const variables = {
        projectId: project.id,
        userId: regularUser.id,
        projectRole: 'DEVELOPER'
      };

      const response = await ownerClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('User is already a member of this project');
    });

    it('should reject adding member without authentication', async () => {
      const mutation = `
        mutation AddProjectMember($projectId: ID!, $userId: ID!, $projectRole: ProjectRole) {
          addProjectMember(projectId: $projectId, userId: $userId, projectRole: $projectRole) {
            id
            projectRole
            user {
              id
            }
            project {
              id
            }
          }
        }
      `;

      const variables = {
        projectId: project.id,
        userId: regularUser.id,
        projectRole: 'DEVELOPER'
      };

      const response = await testClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Authentication required');
    });
  });

  describe('updateProjectMemberRole mutation', () => {
    let member: any;

    beforeEach(async () => {
      // Add a member to update
      const prisma = getPrismaClient();
      member = await prisma.projectMember.create({
        data: {
          userId: regularUser.id,
          projectId: project.id,
          projectRole: 'MEMBER'
        }
      });
    });

    it('should update project member role successfully as admin', async () => {
      const mutation = `
        mutation UpdateProjectMemberRole($projectId: ID!, $userId: ID!, $projectRole: ProjectRole!) {
          updateProjectMemberRole(projectId: $projectId, userId: $userId, projectRole: $projectRole) {
            id
            projectRole
            joinedAt
            user {
              id
              username
            }
            project {
              id
              name
            }
          }
        }
      `;

      const variables = {
        projectId: project.id,
        userId: regularUser.id,
        projectRole: 'DEVELOPER'
      };

      const response = await adminClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.updateProjectMemberRole).toBeDefined();
      expect(response.body.data.updateProjectMemberRole.projectRole).toBe('DEVELOPER');
    });

    it('should update project member role successfully as project owner', async () => {
      const mutation = `
        mutation UpdateProjectMemberRole($projectId: ID!, $userId: ID!, $projectRole: ProjectRole!) {
          updateProjectMemberRole(projectId: $projectId, userId: $userId, projectRole: $projectRole) {
            id
            projectRole
            joinedAt
            user {
              id
              username
            }
            project {
              id
              name
            }
          }
        }
      `;

      const variables = {
        projectId: project.id,
        userId: regularUser.id,
        projectRole: 'MAINTAINER'
      };

      const response = await ownerClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.updateProjectMemberRole).toBeDefined();
      expect(response.body.data.updateProjectMemberRole.projectRole).toBe('MAINTAINER');
    });

    it('should reject updating member by non-owner non-admin', async () => {
      const mutation = `
        mutation UpdateProjectMemberRole($projectId: ID!, $userId: ID!, $projectRole: ProjectRole!) {
          updateProjectMemberRole(projectId: $projectId, userId: $userId, projectRole: $projectRole) {
            id
            projectRole
            user {
              id
            }
            project {
              id
            }
          }
        }
      `;

      const variables = {
        projectId: project.id,
        userId: regularUser.id,
        projectRole: 'DEVELOPER'
      };

      const response = await userClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('No permission to update project member roles');
    });
  });

  describe('removeProjectMember mutation', () => {
    let member: any;

    beforeEach(async () => {
      // Add a member to remove
      const prisma = getPrismaClient();
      member = await prisma.projectMember.create({
        data: {
          userId: regularUser.id,
          projectId: project.id,
          projectRole: 'MEMBER'
        }
      });
    });

    it('should remove project member successfully as admin', async () => {
      const mutation = `
        mutation RemoveProjectMember($projectId: ID!, $userId: ID!) {
          removeProjectMember(projectId: $projectId, userId: $userId)
        }
      `;

      const variables = {
        projectId: project.id,
        userId: regularUser.id
      };

      const response = await adminClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.removeProjectMember).toBe(true);
    });

    it('should remove project member successfully as project owner', async () => {
      const mutation = `
        mutation RemoveProjectMember($projectId: ID!, $userId: ID!) {
          removeProjectMember(projectId: $projectId, userId: $userId)
        }
      `;

      const variables = {
        projectId: project.id,
        userId: regularUser.id
      };

      const response = await ownerClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.removeProjectMember).toBe(true);
    });

    it('should reject removing member by non-owner non-admin', async () => {
      const mutation = `
        mutation RemoveProjectMember($projectId: ID!, $userId: ID!) {
          removeProjectMember(projectId: $projectId, userId: $userId)
        }
      `;

      const variables = {
        projectId: project.id,
        userId: regularUser.id
      };

      const response = await userClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('No permission to remove project members');
    });

    it('should reject removing non-existent member', async () => {
      const mutation = `
        mutation RemoveProjectMember($projectId: ID!, $userId: ID!) {
          removeProjectMember(projectId: $projectId, userId: $userId)
        }
      `;

      const variables = {
        projectId: project.id,
        userId: 'clx1234567890123456789012' // Valid CUID format but non-existent
      };

      const response = await ownerClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Project member not found');
    });
  });


}); 