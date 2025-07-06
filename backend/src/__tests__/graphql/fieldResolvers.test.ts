import {
  getPrismaClient,
  createTestUser,
  createTestProject,
  createTestIssue,
  createTestComment,
  cleanDatabase,
  createGraphQLAuthenticatedClient
} from '../helpers/graphqlTestUtils';

describe('GraphQL Field Resolvers', () => {
  let adminUser: any;
  let regularUser: any;
  let project: any;
  let issue: any;
  let comment: any;
  let adminClient: any;
  let userClient: any;

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
      ownerId: regularUser.id
    });

    // Add users as project members
    const prisma = getPrismaClient();
    await prisma.projectMember.create({
      data: {
        userId: regularUser.id,
        projectId: project.id,
        projectRole: 'OWNER'
      }
    });

    await prisma.projectMember.create({
      data: {
        userId: adminUser.id,
        projectId: project.id,
        projectRole: 'DEVELOPER'
      }
    });

    // Create test issue
    issue = await createTestIssue({
      title: 'Test Issue',
      description: 'Test Description',
      status: 'TODO',
      priority: 'MEDIUM',
      type: 'BUG',
      projectId: project.id,
      reporterId: regularUser.id,
      assigneeId: adminUser.id
    });

    // Create test comment
    comment = await createTestComment({
      content: 'Test Comment',
      issueId: issue.id,
      authorId: regularUser.id
    });

    // Create test clients
    adminClient = await createGraphQLAuthenticatedClient(adminUser.id);
    userClient = await createGraphQLAuthenticatedClient(regularUser.id);
  });

  afterEach(async () => {
    if (adminClient) await adminClient.cleanup();
    if (userClient) await userClient.cleanup();
  });

  describe('User Field Resolvers', () => {
    describe('issues field', () => {
      it('should return user issues for admin viewing any user', async () => {
        const query = `
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              username
              issues {
                id
                title
                status
                project {
                  id
                  name
                }
                assignee {
                  id
                  username
                }
              }
            }
          }
        `;

        const response = await adminClient.query(query, { id: regularUser.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.issues).toBeDefined();
        expect(response.body.data.user.issues.length).toBeGreaterThan(0);
        expect(response.body.data.user.issues[0].title).toBe('Test Issue');
      });

      it('should return user issues for user viewing themselves', async () => {
        const query = `
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              username
              issues {
                id
                title
                status
                project {
                  id
                  name
                }
                assignee {
                  id
                  username
                }
              }
            }
          }
        `;

        const response = await userClient.query(query, { id: regularUser.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.issues).toBeDefined();
        expect(response.body.data.user.issues.length).toBeGreaterThan(0);
      });

      it('should reject user viewing other user issues', async () => {
        const query = `
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              username
              issues {
                id
                title
              }
            }
          }
        `;

        const response = await userClient.query(query, { id: adminUser.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toBe('No permission to view this user');
      });
    });

    describe('assignedIssues field', () => {
      it('should return assigned issues for admin viewing any user', async () => {
        const query = `
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              username
              assignedIssues {
                id
                title
                status
                project {
                  id
                  name
                }
                reporter {
                  id
                  username
                }
              }
            }
          }
        `;

        const response = await adminClient.query(query, { id: adminUser.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.assignedIssues).toBeDefined();
        expect(response.body.data.user.assignedIssues.length).toBeGreaterThan(0);
        expect(response.body.data.user.assignedIssues[0].title).toBe('Test Issue');
      });

      it('should return assigned issues for user viewing themselves', async () => {
        const query = `
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              username
              assignedIssues {
                id
                title
                status
                project {
                  id
                  name
                }
                reporter {
                  id
                  username
                }
              }
            }
          }
        `;

        const response = await adminClient.query(query, { id: adminUser.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.assignedIssues).toBeDefined();
        expect(response.body.data.user.assignedIssues.length).toBeGreaterThan(0);
      });

      it('should reject user viewing other user assigned issues', async () => {
        const query = `
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              username
              assignedIssues {
                id
                title
              }
            }
          }
        `;

        const response = await userClient.query(query, { id: adminUser.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toBe('No permission to view this user');
      });
    });

    describe('projects field', () => {
      it('should return user projects for admin viewing any user', async () => {
        const query = `
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              username
              projects {
                id
                name
                description
              }
            }
          }
        `;

        const response = await adminClient.query(query, { id: regularUser.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.projects).toBeDefined();
        expect(response.body.data.user.projects.length).toBeGreaterThan(0);
        expect(response.body.data.user.projects[0].name).toBe('Test Project');
      });

      it('should return user projects for user viewing themselves', async () => {
        const query = `
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              username
              projects {
                id
                name
                description
              }
            }
          }
        `;

        const response = await userClient.query(query, { id: regularUser.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.projects).toBeDefined();
        expect(response.body.data.user.projects.length).toBeGreaterThan(0);
      });

      it('should reject user viewing other user projects', async () => {
        const query = `
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              username
              projects {
                id
                name
              }
            }
          }
        `;

        const response = await userClient.query(query, { id: adminUser.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toBe('No permission to view this user');
      });
    });

    describe('projectMemberships field', () => {
      it('should return user project memberships for admin viewing any user', async () => {
        const query = `
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              username
              projectMemberships {
                id
                projectRole
                project {
                  id
                  name
                }
              }
            }
          }
        `;

        const response = await adminClient.query(query, { id: regularUser.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.projectMemberships).toBeDefined();
        expect(response.body.data.user.projectMemberships.length).toBeGreaterThan(0);
        expect(response.body.data.user.projectMemberships[0].projectRole).toBe('OWNER');
      });

      it('should return user project memberships for user viewing themselves', async () => {
        const query = `
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              username
              projectMemberships {
                id
                projectRole
                project {
                  id
                  name
                }
              }
            }
          }
        `;

        const response = await userClient.query(query, { id: regularUser.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.projectMemberships).toBeDefined();
        expect(response.body.data.user.projectMemberships.length).toBeGreaterThan(0);
      });

      it('should reject user viewing other user memberships', async () => {
        const query = `
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              username
              projectMemberships {
                id
                projectRole
              }
            }
          }
        `;

        const response = await userClient.query(query, { id: adminUser.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toBe('No permission to view this user');
      });
    });
  });

  describe('Project Field Resolvers', () => {
    describe('issues field', () => {
      it('should return project issues for admin', async () => {
        const query = `
          query GetProject($id: ID!) {
            project(id: $id) {
              id
              name
              issues {
                id
                title
                status
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
          }
        `;

        const response = await adminClient.query(query, { id: project.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.project).toBeDefined();
        expect(response.body.data.project.issues).toBeDefined();
        expect(response.body.data.project.issues.length).toBeGreaterThan(0);
        expect(response.body.data.project.issues[0].title).toBe('Test Issue');
      });

      it('should return project issues for project member', async () => {
        const query = `
          query GetProject($id: ID!) {
            project(id: $id) {
              id
              name
              issues {
                id
                title
                status
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
          }
        `;

        const response = await userClient.query(query, { id: project.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.project).toBeDefined();
        expect(response.body.data.project.issues).toBeDefined();
        expect(response.body.data.project.issues.length).toBeGreaterThan(0);
      });

      it('should reject non-member viewing project issues', async () => {
        // Create a user who is not a project member
        const nonMember = await createTestUser({
          username: 'nonmember',
          email: 'nonmember@example.com',
          role: 'USER'
        });

        const nonMemberClient = await createGraphQLAuthenticatedClient(nonMember.id);

        const query = `
          query GetProject($id: ID!) {
            project(id: $id) {
              id
              name
              issues {
                id
                title
              }
            }
          }
        `;

        const response = await nonMemberClient.query(query, { id: project.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toBe('No permission to view this project');

        await nonMemberClient.cleanup();
      });
    });

    describe('members field', () => {
      it('should return project members for admin', async () => {
        const query = `
          query GetProject($id: ID!) {
            project(id: $id) {
              id
              name
              members {
                id
                username
                email
              }
            }
          }
        `;

        const response = await adminClient.query(query, { id: project.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.project).toBeDefined();
        expect(response.body.data.project.members).toBeDefined();
        expect(response.body.data.project.members.length).toBeGreaterThan(0);
      });

      it('should return project members for project member', async () => {
        const query = `
          query GetProject($id: ID!) {
            project(id: $id) {
              id
              name
              members {
                id
                username
                email
              }
            }
          }
        `;

        const response = await userClient.query(query, { id: project.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.project).toBeDefined();
        expect(response.body.data.project.members).toBeDefined();
        expect(response.body.data.project.members.length).toBeGreaterThan(0);
      });

      it('should reject non-member viewing project members', async () => {
        // Create a user who is not a project member
        const nonMember = await createTestUser({
          username: 'nonmember',
          email: 'nonmember@example.com',
          role: 'USER'
        });

        const nonMemberClient = await createGraphQLAuthenticatedClient(nonMember.id);

        const query = `
          query GetProject($id: ID!) {
            project(id: $id) {
              id
              name
              members {
                id
                username
              }
            }
          }
        `;

        const response = await nonMemberClient.query(query, { id: project.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toBe('No permission to view this project');

        await nonMemberClient.cleanup();
      });
    });

    describe('projectMembers field', () => {
      it('should return project members with roles for admin', async () => {
        const query = `
          query GetProject($id: ID!) {
            project(id: $id) {
              id
              name
              projectMembers {
                id
                projectRole
                joinedAt
                user {
                  id
                  username
                  email
                }
              }
            }
          }
        `;

        const response = await adminClient.query(query, { id: project.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.project).toBeDefined();
        expect(response.body.data.project.projectMembers).toBeDefined();
        expect(response.body.data.project.projectMembers.length).toBeGreaterThan(0);
        expect(response.body.data.project.projectMembers[0].projectRole).toBeDefined();
        expect(response.body.data.project.projectMembers[0].user).toBeDefined();
      });

      it('should return project members with roles for project member', async () => {
        const query = `
          query GetProject($id: ID!) {
            project(id: $id) {
              id
              name
              projectMembers {
                id
                projectRole
                joinedAt
                user {
                  id
                  username
                  email
                }
              }
            }
          }
        `;

        const response = await userClient.query(query, { id: project.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.project).toBeDefined();
        expect(response.body.data.project.projectMembers).toBeDefined();
        expect(response.body.data.project.projectMembers.length).toBeGreaterThan(0);
      });

      it('should reject non-member viewing project members with roles', async () => {
        // Create a user who is not a project member
        const nonMember = await createTestUser({
          username: 'nonmember',
          email: 'nonmember@example.com',
          role: 'USER'
        });

        const nonMemberClient = await createGraphQLAuthenticatedClient(nonMember.id);

        const query = `
          query GetProject($id: ID!) {
            project(id: $id) {
              id
              name
              projectMembers {
                id
                projectRole
              }
            }
          }
        `;

        const response = await nonMemberClient.query(query, { id: project.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toBe('No permission to view this project');

        await nonMemberClient.cleanup();
      });
    });
  });

  describe('Issue Field Resolvers', () => {
    describe('project field', () => {
      it('should return issue project', async () => {
        const query = `
          query GetIssue($id: ID!) {
            issue(id: $id) {
              id
              title
              project {
                id
                name
                description
              }
            }
          }
        `;

        const response = await userClient.query(query, { id: issue.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.issue).toBeDefined();
        expect(response.body.data.issue.project).toBeDefined();
        expect(response.body.data.issue.project.id).toBe(project.id);
        expect(response.body.data.issue.project.name).toBe('Test Project');
      });
    });

    describe('reporter field', () => {
      it('should return issue reporter', async () => {
        const query = `
          query GetIssue($id: ID!) {
            issue(id: $id) {
              id
              title
              reporter {
                id
                username
                email
              }
            }
          }
        `;

        const response = await userClient.query(query, { id: issue.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.issue).toBeDefined();
        expect(response.body.data.issue.reporter).toBeDefined();
        expect(response.body.data.issue.reporter.id).toBe(regularUser.id);
        expect(response.body.data.issue.reporter.username).toBe('user');
      });
    });

    describe('assignee field', () => {
      it('should return issue assignee when assigned', async () => {
        const query = `
          query GetIssue($id: ID!) {
            issue(id: $id) {
              id
              title
              assignee {
                id
                username
                email
              }
            }
          }
        `;

        const response = await userClient.query(query, { id: issue.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.issue).toBeDefined();
        expect(response.body.data.issue.assignee).toBeDefined();
        expect(response.body.data.issue.assignee.id).toBe(adminUser.id);
        expect(response.body.data.issue.assignee.username).toBe('admin');
      });

      it('should return null for unassigned issue', async () => {
        // Create an unassigned issue
        const unassignedIssue = await createTestIssue({
          title: 'Unassigned Issue',
          description: 'No assignee',
          status: 'TODO',
          priority: 'LOW',
          type: 'TASK',
          projectId: project.id,
          reporterId: regularUser.id
        });

        const query = `
          query GetIssue($id: ID!) {
            issue(id: $id) {
              id
              title
              assignee {
                id
                username
              }
            }
          }
        `;

        const response = await userClient.query(query, { id: unassignedIssue.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.issue).toBeDefined();
        expect(response.body.data.issue.assignee).toBeNull();
      });
    });

    describe('comments field', () => {
      it('should return issue comments', async () => {
        const query = `
          query GetIssue($id: ID!) {
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

        const response = await userClient.query(query, { id: issue.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.issue).toBeDefined();
        expect(response.body.data.issue.comments).toBeDefined();
        expect(response.body.data.issue.comments.length).toBeGreaterThan(0);
        expect(response.body.data.issue.comments[0].content).toBe('Test Comment');
        expect(response.body.data.issue.comments[0].author).toBeDefined();
      });
    });
  });

  describe('Comment Field Resolvers', () => {
    describe('author field', () => {
      it('should return comment author through issue comments', async () => {
        const query = `
          query GetIssue($id: ID!) {
            issue(id: $id) {
              id
              title
              comments {
                id
                content
                author {
                  id
                  username
                  email
                }
              }
            }
          }
        `;

        const response = await userClient.query(query, { id: issue.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.issue).toBeDefined();
        expect(response.body.data.issue.comments).toBeDefined();
        expect(response.body.data.issue.comments.length).toBeGreaterThan(0);
        expect(response.body.data.issue.comments[0].author).toBeDefined();
        expect(response.body.data.issue.comments[0].author.id).toBe(regularUser.id);
        expect(response.body.data.issue.comments[0].author.username).toBe('user');
      });
    });

    describe('issue field', () => {
      it('should return comment issue through issue comments', async () => {
        const query = `
          query GetIssue($id: ID!) {
            issue(id: $id) {
              id
              title
              comments {
                id
                content
                issue {
                  id
                  title
                  status
                }
              }
            }
          }
        `;

        const response = await userClient.query(query, { id: issue.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.issue).toBeDefined();
        expect(response.body.data.issue.comments).toBeDefined();
        expect(response.body.data.issue.comments.length).toBeGreaterThan(0);
        expect(response.body.data.issue.comments[0].issue).toBeDefined();
        expect(response.body.data.issue.comments[0].issue.id).toBe(issue.id);
        expect(response.body.data.issue.comments[0].issue.title).toBe('Test Issue');
      });
    });
  });

  describe('ProjectMember Field Resolvers', () => {
    describe('user field', () => {
      it('should return project member user', async () => {
        const query = `
          query GetProject($id: ID!) {
            project(id: $id) {
              id
              name
              projectMembers {
                id
                projectRole
                user {
                  id
                  username
                  email
                }
              }
            }
          }
        `;

        const response = await userClient.query(query, { id: project.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.project).toBeDefined();
        expect(response.body.data.project.projectMembers).toBeDefined();
        expect(response.body.data.project.projectMembers.length).toBeGreaterThan(0);
        expect(response.body.data.project.projectMembers[0].user).toBeDefined();
        expect(response.body.data.project.projectMembers[0].user.username).toBeDefined();
      });
    });

    describe('project field', () => {
      it('should return project member project', async () => {
        const query = `
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              username
              projectMemberships {
                id
                projectRole
                project {
                  id
                  name
                  description
                }
              }
            }
          }
        `;

        const response = await userClient.query(query, { id: regularUser.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.projectMemberships).toBeDefined();
        expect(response.body.data.user.projectMemberships.length).toBeGreaterThan(0);
        expect(response.body.data.user.projectMemberships[0].project).toBeDefined();
        expect(response.body.data.user.projectMemberships[0].project.name).toBe('Test Project');
      });
    });
  });
}); 