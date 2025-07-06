import {
  getPrismaClient,
  createTestUser,
  createTestProject,
  createTestIssue,
  cleanDatabase,
  createGraphQLTestClient,
  createGraphQLAuthenticatedClient
} from '../helpers/graphqlTestUtils';

describe('GraphQL Comments', () => {
  let testClient: any;
  let adminUser: any;
  let regularUser: any;
  let adminClient: any;
  let userClient: any;
  let project: any;
  let issue: any;

  beforeEach(async () => {
    await cleanDatabase();
    
    // Create test users
    adminUser = await createTestUser({
      username: 'admin',
      email: 'admin@example.com',
      role: 'ADMIN'
    });

    regularUser = await createTestUser({
      username: 'user',
      email: 'user@example.com',
      role: 'USER'
    });

    // Create test project
    project = await createTestProject({
      name: 'Test Project',
      ownerId: adminUser.id
    });

    // Add regular user as project member
    const prisma = getPrismaClient();
    await prisma.projectMember.create({
      data: {
        userId: regularUser.id,
        projectId: project.id,
        projectRole: 'DEVELOPER'
      }
    });

    // Create test issue
    issue = await createTestIssue({
      title: 'Test Issue',
      projectId: project.id,
      reporterId: regularUser.id
    });

    // Create test clients
    testClient = await createGraphQLTestClient();
    adminClient = await createGraphQLAuthenticatedClient(adminUser.id);
    userClient = await createGraphQLAuthenticatedClient(regularUser.id);
  });

  afterEach(async () => {
    if (testClient) await testClient.cleanup();
    if (adminClient) await adminClient.cleanup();
    if (userClient) await userClient.cleanup();
  });

  describe('createComment mutation', () => {
    it('should create comment successfully as project member', async () => {
      const mutation = `
        mutation CreateComment($issueId: ID!, $content: String!) {
          createComment(issueId: $issueId, content: $content) {
            id
            content
            createdAt
            updatedAt
            author {
              id
              username
            }
            issue {
              id
              title
            }
          }
        }
      `;

      const variables = {
        issueId: issue.id,
        content: 'This is a test comment'
      };

      const response = await userClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.createComment).toBeDefined();
      expect(response.body.data.createComment.content).toBe('This is a test comment');
      expect(response.body.data.createComment.author.id).toBe(regularUser.id);
      expect(response.body.data.createComment.issue.id).toBe(issue.id);
      expect(response.body.data.createComment.author).toBeDefined();
      expect(response.body.data.createComment.issue).toBeDefined();
    });

    it('should reject comment creation without authentication', async () => {
      const mutation = `
        mutation CreateComment($issueId: ID!, $content: String!) {
          createComment(issueId: $issueId, content: $content) {
            id
            content
            author {
              id
            }
            issue {
              id
            }
          }
        }
      `;

      const variables = {
        issueId: issue.id,
        content: 'This is a test comment'
      };

      const response = await testClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Authentication required');
    });

    it('should reject comment creation with empty content', async () => {
      const mutation = `
        mutation CreateComment($issueId: ID!, $content: String!) {
          createComment(issueId: $issueId, content: $content) {
            id
            content
            author {
              id
            }
            issue {
              id
            }
          }
        }
      `;

      const variables = {
        issueId: issue.id,
        content: '' // Empty content
      };

      const response = await userClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Comment Content is required');
    });

    it('should reject comment creation for non-member', async () => {
      // Create another user who is not a project member
      const nonMember = await createTestUser({
        username: 'nonmember',
        email: 'nonmember@example.com',
        role: 'USER'
      });

      const nonMemberClient = await createGraphQLAuthenticatedClient(nonMember.id);

      const mutation = `
        mutation CreateComment($issueId: ID!, $content: String!) {
          createComment(issueId: $issueId, content: $content) {
            id
            content
            author {
              id
            }
            issue {
              id
            }
          }
        }
      `;

      const variables = {
        issueId: issue.id,
        content: 'This is a test comment'
      };

      const response = await nonMemberClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('No permission to comment on this issue');

      await nonMemberClient.cleanup();
    });
  });

  describe('updateComment mutation', () => {
    let comment: any;

    beforeEach(async () => {
      const prisma = getPrismaClient();
      comment = await prisma.comment.create({
        data: {
          content: 'Original comment content',
          issueId: issue.id,
          authorId: regularUser.id
        }
      });
    });

    it('should update comment successfully as author', async () => {
      const mutation = `
        mutation UpdateComment($id: ID!, $content: String!) {
          updateComment(id: $id, content: $content) {
            id
            content
            updatedAt
          }
        }
      `;

      const variables = {
        id: comment.id,
        content: 'Updated comment content'
      };

      const response = await userClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.updateComment).toBeDefined();
      expect(response.body.data.updateComment.content).toBe('Updated comment content');
    });

    it('should update comment as admin', async () => {
      const mutation = `
        mutation UpdateComment($id: ID!, $content: String!) {
          updateComment(id: $id, content: $content) {
            id
            content
            updatedAt
          }
        }
      `;

      const variables = {
        id: comment.id,
        content: 'Admin updated comment content'
      };

      const response = await adminClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.updateComment).toBeDefined();
      expect(response.body.data.updateComment.content).toBe('Admin updated comment content');
    });

    it('should reject update by non-author non-admin', async () => {
      // Create another user who is a project member but not the comment author
      const otherUser = await createTestUser({
        username: 'otheruser',
        email: 'other@example.com',
        role: 'USER'
      });

      const prisma = getPrismaClient();
      await prisma.projectMember.create({
        data: {
          userId: otherUser.id,
          projectId: project.id,
          projectRole: 'DEVELOPER'
        }
      });

      const otherClient = await createGraphQLAuthenticatedClient(otherUser.id);

      const mutation = `
        mutation UpdateComment($id: ID!, $content: String!) {
          updateComment(id: $id, content: $content) {
            id
            content
          }
        }
      `;

      const variables = {
        id: comment.id,
        content: 'Unauthorized update'
      };

      const response = await otherClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('No permission to edit this comment');

      await otherClient.cleanup();
    });

    it('should reject update with empty content', async () => {
      const mutation = `
        mutation UpdateComment($id: ID!, $content: String!) {
          updateComment(id: $id, content: $content) {
            id
            content
          }
        }
      `;

      const variables = {
        id: comment.id,
        content: '' // Empty content
      };

      const response = await userClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Comment Content is required');
    });
  });

  describe('deleteComment mutation', () => {
    let comment: any;

    beforeEach(async () => {
      const prisma = getPrismaClient();
      comment = await prisma.comment.create({
        data: {
          content: 'Comment to delete',
          issueId: issue.id,
          authorId: regularUser.id
        }
      });
    });

    it('should delete comment successfully as author', async () => {
      const mutation = `
        mutation DeleteComment($id: ID!) {
          deleteComment(id: $id)
        }
      `;

      const variables = { id: comment.id };

      const response = await userClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.deleteComment).toBe(true);
    });

    it('should delete comment as admin', async () => {
      const mutation = `
        mutation DeleteComment($id: ID!) {
          deleteComment(id: $id)
        }
      `;

      const variables = { id: comment.id };

      const response = await adminClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.deleteComment).toBe(true);
    });

    it('should reject delete by non-author non-admin', async () => {
      // Create another user who is a project member but not the comment author
      const otherUser = await createTestUser({
        username: 'otheruser',
        email: 'other@example.com',
        role: 'USER'
      });

      const prisma = getPrismaClient();
      await prisma.projectMember.create({
        data: {
          userId: otherUser.id,
          projectId: project.id,
          projectRole: 'DEVELOPER'
        }
      });

      const otherClient = await createGraphQLAuthenticatedClient(otherUser.id);

      const mutation = `
        mutation DeleteComment($id: ID!) {
          deleteComment(id: $id)
        }
      `;

      const variables = { id: comment.id };

      const response = await otherClient.mutate(mutation, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('No permission to delete this comment');

      await otherClient.cleanup();
    });
  });

  describe('Issue comments field', () => {
    beforeEach(async () => {
      // Create multiple comments
      const prisma = getPrismaClient();
      await prisma.comment.create({
        data: {
          content: 'First comment',
          issueId: issue.id,
          authorId: regularUser.id
        }
      });

      await prisma.comment.create({
        data: {
          content: 'Second comment',
          issueId: issue.id,
          authorId: adminUser.id
        }
      });

      await prisma.comment.create({
        data: {
          content: 'Third comment',
          issueId: issue.id,
          authorId: regularUser.id
        }
      });
    });

    it('should return comments for project member', async () => {
      const query = `
        query Issue($id: ID!) {
          issue(id: $id) {
            id
            title
            comments {
              id
              content
              createdAt
              updatedAt
              author {
                id
                username
                email
              }
            }
          }
        }
      `;

      const variables = { id: issue.id };

      const response = await userClient.query(query, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.issue).toBeDefined();
      expect(response.body.data.issue.comments).toBeDefined();
      expect(response.body.data.issue.comments.length).toBe(3);
      expect(response.body.data.issue.comments[0].content).toBeDefined();
      expect(response.body.data.issue.comments[0].author).toBeDefined();
    });

    it('should return comments for admin', async () => {
      const query = `
        query Issue($id: ID!) {
          issue(id: $id) {
            id
            title
            comments {
              id
              content
              createdAt
              updatedAt
              author {
                id
                username
                email
              }
            }
          }
        }
      `;

      const variables = { id: issue.id };

      const response = await adminClient.query(query, variables);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.issue).toBeDefined();
      expect(response.body.data.issue.comments).toBeDefined();
      expect(response.body.data.issue.comments.length).toBe(3);
    });

    it('should reject query for non-member', async () => {
      // Create a user who is not a project member
      const nonMember = await createTestUser({
        username: 'nonmember',
        email: 'nonmember@example.com',
        role: 'USER'
      });

      const nonMemberClient = await createGraphQLAuthenticatedClient(nonMember.id);

      const query = `
        query Issue($id: ID!) {
          issue(id: $id) {
            id
            title
            comments {
              id
              content
              author {
                id
                username
              }
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

    it('should reject query without authentication', async () => {
      const query = `
        query Issue($id: ID!) {
          issue(id: $id) {
            id
            title
            comments {
              id
              content
              author {
                id
                username
              }
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
}); 