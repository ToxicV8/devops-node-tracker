import { getPrismaClient } from "../helpers/graphqlTestUtils";
import { createAuthenticatedClient, createTestClient } from "../helpers/testClient";

describe('GraphQL Issues', () => {
  let testClient: any;
  let adminUser: any;
  let regularUser: any;
  let adminClient: any;
  let userClient: any;
  let project: any;
  let prismaClient: any;

  beforeAll(async () => {
    prismaClient = getPrismaClient();
  });

  afterAll(async () => {
    await global.testUtils.cleanDatabase();
  });

  beforeEach(async () => {
    await global.testUtils.cleanDatabase();
    
    // Create test users
    adminUser = await global.testUtils.createTestUser({
      username: 'admin',
      email: 'admin@example.com',
      role: 'ADMIN'
    });

    regularUser = await global.testUtils.createTestUser({
      username: 'user',
      email: 'user@example.com',
      role: 'USER'
    });

    // Create test project
    project = await global.testUtils.createTestProject({
      name: 'Test Project',
      ownerId: adminUser.id
    });

    // Add regular user as project member
    await prismaClient.projectMember.create({
      data: {
        userId: regularUser.id,
        projectId: project.id,
        projectRole: 'DEVELOPER'
      }
    });

    // Create test clients
    testClient = await createTestClient();
    adminClient = await createAuthenticatedClient(adminUser.id);
    userClient = await createAuthenticatedClient(regularUser.id);
  });

  afterEach(async () => {
    if (testClient) await testClient.cleanup();
    if (adminClient) await adminClient.cleanup();
    if (userClient) await userClient.cleanup();
  });

  describe('createIssue mutation', () => {
    it('should create issue successfully as project member', async () => {
      const mutation = `
        mutation CreateIssue($title: String!, $description: String, $projectId: ID!, $status: IssueStatus!, $priority: IssuePriority!, $type: IssueType!, $assigneeId: ID) {
          createIssue(title: $title, description: $description, projectId: $projectId, status: $status, priority: $priority, type: $type, assigneeId: $assigneeId) {
            id
            title
            description
            status
            priority
            type
            createdAt
            updatedAt
            project {
              id
              name
            }
            reporter {
              id
              username
            }
            assignee {
              id
              username
            }
          }
        }
      `;

      const variables = {
        title: 'Test Issue',
        description: 'Test issue description',
        projectId: project.id,
        status: 'TODO',
        priority: 'MEDIUM',
        type: 'TASK'
      };

      const response = await userClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      if (response.body.errors) {
        console.log('GraphQL Errors:', response.body.errors);
      }
      expect(response.body.data.createIssue).toBeDefined();
      expect(response.body.data.createIssue.title).toBe('Test Issue');
      expect(response.body.data.createIssue.description).toBe('Test issue description');
      expect(response.body.data.createIssue.project.id).toBe(project.id);
      expect(response.body.data.createIssue.reporter.id).toBe(regularUser.id);
    });

    it('should reject issue creation without authentication', async () => {
      const mutation = `
        mutation CreateIssue($title: String!, $projectId: ID!, $status: IssueStatus!, $priority: IssuePriority!, $type: IssueType!) {
          createIssue(title: $title, projectId: $projectId, status: $status, priority: $priority, type: $type) {
            id
            title
            project {
              id
            }
          }
        }
      `;

      const variables = {
        title: 'Test Issue',
        projectId: project.id,
        status: 'TODO',
        priority: 'MEDIUM',
        type: 'TASK'
      };

      const response = await testClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Authentication required');
    });

    it('should reject issue creation with invalid title', async () => {
      const mutation = `
        mutation CreateIssue($title: String!, $projectId: ID!, $status: IssueStatus!, $priority: IssuePriority!, $type: IssueType!) {
          createIssue(title: $title, projectId: $projectId, status: $status, priority: $priority, type: $type) {
            id
            title
            project {
              id
            }
          }
        }
      `;

      const variables = {
        title: '', // Empty title
        projectId: project.id,
        status: 'TODO',
        priority: 'MEDIUM',
        type: 'TASK'
      };

      const response = await userClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Issue Title is required');
    });

    it('should reject issue creation for non-member', async () => {
      // Create another user who is not a project member
      const nonMember = await global.testUtils.createTestUser({
        username: 'nonmember',
        email: 'nonmember@example.com',
        role: 'USER'
      });

      const nonMemberClient = await createAuthenticatedClient(nonMember.id);

      const mutation = `
        mutation CreateIssue($title: String!, $projectId: ID!, $status: IssueStatus!, $priority: IssuePriority!, $type: IssueType!) {
          createIssue(title: $title, projectId: $projectId, status: $status, priority: $priority, type: $type) {
            id
            title
            project {
              id
            }
          }
        }
      `;

      const variables = {
        title: 'Test Issue',
        projectId: project.id,
        status: 'TODO',
        priority: 'MEDIUM',
        type: 'TASK'
      };

      const response = await nonMemberClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('No permission to create issues in this project');

      await nonMemberClient.cleanup();
    });
  });

  describe('issues query', () => {
    let issue1: any;
    let issue2: any;

    beforeEach(async () => {
      // Create test issues
      issue1 = await global.testUtils.createTestIssue({
        title: 'Issue 1',
        projectId: project.id,
        reporterId: adminUser.id
      });

      issue2 = await global.testUtils.createTestIssue({
        title: 'Issue 2',
        projectId: project.id,
        reporterId: regularUser.id
      });
    });

    it('should return all issues for admin', async () => {
      const query = `
        query Issues($projectId: ID) {
          issues(projectId: $projectId) {
            id
            title
            description
            status
            priority
            type
            project {
              id
              name
            }
            reporter {
              id
              username
            }
            assignee {
              id
              username
            }
          }
        }
      `;

      const variables = { projectId: project.id };

      const response = await adminClient.query(query, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.issues).toBeDefined();
      expect(response.body.data.issues).toHaveLength(2);
    });

    it('should return project issues for project member', async () => {
      const query = `
        query Issues($projectId: ID) {
          issues(projectId: $projectId) {
            id
            title
            description
            status
            priority
            type
            project {
              id
              name
            }
            reporter {
              id
              username
            }
            assignee {
              id
              username
            }
          }
        }
      `;

      const variables = { projectId: project.id };

      const response = await userClient.query(query, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.issues).toBeDefined();
      expect(response.body.data.issues).toHaveLength(2);
    });

    it('should filter issues by status', async () => {
      // Update issue1 to have different status
      await prismaClient.issue.update({
        where: { id: issue1.id },
        data: { status: 'IN_PROGRESS' }
      });

      const query = `
        query Issues($projectId: ID, $status: IssueStatus) {
          issues(projectId: $projectId, status: $status) {
            id
            title
            status
          }
        }
      `;

      const variables = { 
        projectId: project.id,
        status: 'IN_PROGRESS'
      };

      const response = await userClient.query(query, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.issues).toBeDefined();
      expect(response.body.data.issues).toHaveLength(1);
      expect(response.body.data.issues[0].status).toBe('IN_PROGRESS');
    });

    it('should reject issues query without authentication', async () => {
      const query = `
        query Issues($projectId: ID) {
          issues(projectId: $projectId) {
            id
            title
            project {
              id
            }
          }
        }
      `;

      const variables = { projectId: project.id };

      const response = await testClient.query(query, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Authentication required');
    });
  });

  describe('issue query', () => {
    let issue: any;

    beforeEach(async () => {
      issue = await global.testUtils.createTestIssue({
        title: 'Test Issue',
        projectId: project.id,
        reporterId: regularUser.id
      });
    });

    it('should return issue for project member', async () => {
      const query = `
        query Issue($id: ID!) {
          issue(id: $id) {
            id
            title
            description
            status
            priority
            type
            project {
              id
              name
            }
            reporter {
              id
              username
            }
            assignee {
              id
              username
            }
          }
        }
      `;

      const variables = { id: issue.id };

      const response = await userClient.query(query, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.issue).toBeDefined();
      expect(response.body.data.issue.id).toBe(issue.id);
      expect(response.body.data.issue.title).toBe('Test Issue');
      expect(response.body.data.issue.project).toBeDefined();
      expect(response.body.data.issue.reporter).toBeDefined();
    });

    it('should return issue for admin', async () => {
      const query = `
        query Issue($id: ID!) {
          issue(id: $id) {
            id
            title
            description
            status
            priority
            type
            project {
              id
              name
            }
            reporter {
              id
              username
            }
            assignee {
              id
              username
            }
          }
        }
      `;

      const variables = { id: issue.id };

      const response = await adminClient.query(query, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.issue).toBeDefined();
      expect(response.body.data.issue.id).toBe(issue.id);
    });

    it('should reject issue access for non-member', async () => {
      // Create another user who is not a project member
      const nonMember = await global.testUtils.createTestUser({
        username: 'nonmember',
        email: 'nonmember@example.com',
        role: 'USER'
      });

      const nonMemberClient = await createAuthenticatedClient(nonMember.id);

      const query = `
        query Issue($id: ID!) {
          issue(id: $id) {
            id
            title
            project {
              id
            }
          }
        }
      `;

      const variables = { id: issue.id };

      const response = await nonMemberClient.query(query, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('No permission to view this issue');

      await nonMemberClient.cleanup();
    });

    it('should reject issue query without authentication', async () => {
      const query = `
        query Issue($id: ID!) {
          issue(id: $id) {
            id
            title
            project {
              id
            }
          }
        }
      `;

      const variables = { id: issue.id };

      const response = await testClient.query(query, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Authentication required');
    });
  });

  describe('updateIssue mutation', () => {
    let issue: any;

    beforeEach(async () => {
      issue = await global.testUtils.createTestIssue({
        title: 'Test Issue',
        projectId: project.id,
        reporterId: regularUser.id
      });
    });

    it('should update issue successfully as reporter', async () => {
      const mutation = `
        mutation UpdateIssue($id: ID!, $title: String, $description: String, $status: IssueStatus, $priority: IssuePriority, $type: IssueType) {
          updateIssue(id: $id, title: $title, description: $description, status: $status, priority: $priority, type: $type) {
            id
            title
            description
            status
            priority
            type
            updatedAt
          }
        }
      `;

      const variables = {
        id: issue.id,
        title: 'Updated Issue Title',
        description: 'Updated description',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        type: 'BUG'
      };

      const response = await userClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.updateIssue).toBeDefined();
      expect(response.body.data.updateIssue.title).toBe('Updated Issue Title');
      expect(response.body.data.updateIssue.description).toBe('Updated description');
      expect(response.body.data.updateIssue.status).toBe('IN_PROGRESS');
      expect(response.body.data.updateIssue.priority).toBe('HIGH');
      expect(response.body.data.updateIssue.type).toBe('BUG');
    });

    it('should update issue as admin', async () => {
      const mutation = `
        mutation UpdateIssue($id: ID!, $title: String, $description: String, $status: IssueStatus) {
          updateIssue(id: $id, title: $title, description: $description, status: $status) {
            id
            title
            description
            status
            updatedAt
          }
        }
      `;

      const variables = {
        id: issue.id,
        title: 'Admin Updated Issue',
        description: 'Admin updated description',
        status: 'DONE'
      };

      const response = await adminClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.updateIssue).toBeDefined();
      expect(response.body.data.updateIssue.title).toBe('Admin Updated Issue');
      expect(response.body.data.updateIssue.status).toBe('DONE');
    });

    it('should reject update by non-reporter non-admin', async () => {
      // Create another user who is a project member but not the reporter
      const otherUser = await global.testUtils.createTestUser({
        username: 'otheruser',
        email: 'other@example.com',
        role: 'USER'
      });

      await prismaClient.projectMember.create({
        data: {
          userId: otherUser.id,
          projectId: project.id,
          projectRole: 'DEVELOPER'
        }
      });

      const otherClient = await createAuthenticatedClient(otherUser.id);

      const mutation = `
        mutation UpdateIssue($id: ID!, $title: String) {
          updateIssue(id: $id, title: $title) {
            id
            title
          }
        }
      `;

      const variables = {
        id: issue.id,
        title: 'Unauthorized Update'
      };

      const response = await otherClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('No permission to edit this issue');

      await otherClient.cleanup();
    });
  });

  describe('deleteIssue mutation', () => {
    let issue: any;

    beforeEach(async () => {
              issue = await global.testUtils.createTestIssue({
        title: 'Test Issue',
        projectId: project.id,
        reporterId: regularUser.id
      });
    });

    it('should delete issue successfully as reporter', async () => {
      const mutation = `
        mutation DeleteIssue($id: ID!) {
          deleteIssue(id: $id)
        }
      `;

      const variables = { id: issue.id };

      const response = await userClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.deleteIssue).toBe(true);
    });

    it('should delete issue as admin', async () => {
      const mutation = `
        mutation DeleteIssue($id: ID!) {
          deleteIssue(id: $id)
        }
      `;

      const variables = { id: issue.id };

      const response = await adminClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.deleteIssue).toBe(true);
    });

    it('should reject delete by non-reporter non-admin', async () => {
      // Create another user who is a project member but not the reporter
      const otherUser = await global.testUtils.createTestUser({
        username: 'otheruser',
        email: 'other@example.com',
        role: 'USER'
      });

      await prismaClient.projectMember.create({
        data: {
          userId: otherUser.id,
          projectId: project.id,
          projectRole: 'DEVELOPER'
        }
      });

      const otherClient = await createAuthenticatedClient(otherUser.id);

      const mutation = `
        mutation DeleteIssue($id: ID!) {
          deleteIssue(id: $id)
        }
      `;

      const variables = { id: issue.id };

      const response = await otherClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('No permission to delete this issue');

      await otherClient.cleanup();
    });
  });
}); 