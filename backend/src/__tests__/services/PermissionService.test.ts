import { getPrismaClient, createTestUser, createTestProject, cleanDatabase } from '../helpers/graphqlTestUtils';
import { PermissionService } from '../../services/PermissionService';
import { GraphQLError } from 'graphql';

describe('PermissionService', () => {
  let adminUser: any;
  let managerUser: any;
  let regularUser: any;
  let project: any;

  beforeEach(async () => {
    await cleanDatabase();
    
    // Create test users
    adminUser = await createTestUser({
      username: 'admin',
      email: 'admin@example.com',
      role: 'ADMIN'
    });

    managerUser = await createTestUser({
      username: 'manager',
      email: 'manager@example.com',
      role: 'MANAGER'
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
  });

  describe('canAssignIssues', () => {
    it('should return true for admin users', async () => {
      const result = await PermissionService.canAssignIssues(adminUser.id, project.id);
      expect(result).toBe(true);
    });

    it('should return true for manager users', async () => {
      const result = await PermissionService.canAssignIssues(managerUser.id, project.id);
      expect(result).toBe(true);
    });

    it('should return true for project owners', async () => {
      const prisma = getPrismaClient();
      await prisma.projectMember.create({
        data: {
          userId: regularUser.id,
          projectId: project.id,
          projectRole: 'OWNER'
        }
      });

      const result = await PermissionService.canAssignIssues(regularUser.id, project.id);
      expect(result).toBe(true);
    });

    it('should return true for project maintainers', async () => {
      const prisma = getPrismaClient();
      await prisma.projectMember.create({
        data: {
          userId: regularUser.id,
          projectId: project.id,
          projectRole: 'MAINTAINER'
        }
      });

      const result = await PermissionService.canAssignIssues(regularUser.id, project.id);
      expect(result).toBe(true);
    });

    it('should return false for regular users without project permissions', async () => {
      const result = await PermissionService.canAssignIssues(regularUser.id, project.id);
      expect(result).toBe(false);
    });

    it('should return false for non-existent users', async () => {
      const result = await PermissionService.canAssignIssues('non-existent-id', project.id);
      expect(result).toBe(false);
    });
  });

  describe('canEditIssue', () => {
    let issue: any;

    beforeEach(async () => {
      const prisma = getPrismaClient();
      issue = await prisma.issue.create({
        data: {
          title: 'Test Issue',
          description: 'Test Description',
          status: 'TODO',
          priority: 'MEDIUM',
          type: 'BUG',
          projectId: project.id,
          reporterId: regularUser.id
        }
      });
    });

    it('should return true for issue reporter', async () => {
      const result = await PermissionService.canEditIssue(regularUser.id, issue.id);
      expect(result).toBe(true);
    });

    it('should return true for issue assignee', async () => {
      const prisma = getPrismaClient();
      await prisma.issue.update({
        where: { id: issue.id },
        data: { assigneeId: managerUser.id }
      });

      const result = await PermissionService.canEditIssue(managerUser.id, issue.id);
      expect(result).toBe(true);
    });

    it('should return true for admin users', async () => {
      const result = await PermissionService.canEditIssue(adminUser.id, issue.id);
      expect(result).toBe(true);
    });

    it('should return true for manager users', async () => {
      const result = await PermissionService.canEditIssue(managerUser.id, issue.id);
      expect(result).toBe(true);
    });

    it('should return true for project owners', async () => {
      const prisma = getPrismaClient();
      await prisma.projectMember.create({
        data: {
          userId: managerUser.id,
          projectId: project.id,
          projectRole: 'OWNER'
        }
      });

      const result = await PermissionService.canEditIssue(managerUser.id, issue.id);
      expect(result).toBe(true);
    });

    it('should return true for project maintainers', async () => {
      const prisma = getPrismaClient();
      await prisma.projectMember.create({
        data: {
          userId: managerUser.id,
          projectId: project.id,
          projectRole: 'MAINTAINER'
        }
      });

      const result = await PermissionService.canEditIssue(managerUser.id, issue.id);
      expect(result).toBe(true);
    });

    it('should return false for users without permissions', async () => {
      const anotherUser = await createTestUser({
        username: 'another',
        email: 'another@example.com',
        role: 'USER'
      });

      const result = await PermissionService.canEditIssue(anotherUser.id, issue.id);
      expect(result).toBe(false);
    });

    it('should return false for non-existent issue', async () => {
      const result = await PermissionService.canEditIssue(regularUser.id, 'non-existent-issue');
      expect(result).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      const result = await PermissionService.canEditIssue('non-existent-user', issue.id);
      expect(result).toBe(false);
    });
  });

  describe('canManageProject', () => {
    it('should return true for admin users', async () => {
      const result = await PermissionService.canManageProject(adminUser.id, project.id);
      expect(result).toBe(true);
    });

    it('should return true for project owners', async () => {
      const prisma = getPrismaClient();
      await prisma.projectMember.create({
        data: {
          userId: regularUser.id,
          projectId: project.id,
          projectRole: 'OWNER'
        }
      });

      const result = await PermissionService.canManageProject(regularUser.id, project.id);
      expect(result).toBe(true);
    });

    it('should return true for project maintainers', async () => {
      const prisma = getPrismaClient();
      await prisma.projectMember.create({
        data: {
          userId: regularUser.id,
          projectId: project.id,
          projectRole: 'MAINTAINER'
        }
      });

      const result = await PermissionService.canManageProject(regularUser.id, project.id);
      expect(result).toBe(true);
    });

    it('should return false for regular users', async () => {
      const result = await PermissionService.canManageProject(regularUser.id, project.id);
      expect(result).toBe(false);
    });

    it('should return false for manager users without project permissions', async () => {
      const result = await PermissionService.canManageProject(managerUser.id, project.id);
      expect(result).toBe(false);
    });

    it('should return false for non-existent users', async () => {
      const result = await PermissionService.canManageProject('non-existent-id', project.id);
      expect(result).toBe(false);
    });
  });

  describe('canManageProjectMembers', () => {
    it('should return true for admin users', async () => {
      const result = await PermissionService.canManageProjectMembers(adminUser.id, project.id);
      expect(result).toBe(true);
    });

    it('should return true for project owners', async () => {
      const prisma = getPrismaClient();
      await prisma.projectMember.create({
        data: {
          userId: regularUser.id,
          projectId: project.id,
          projectRole: 'OWNER'
        }
      });

      const result = await PermissionService.canManageProjectMembers(regularUser.id, project.id);
      expect(result).toBe(true);
    });

    it('should return true for project maintainers', async () => {
      const prisma = getPrismaClient();
      await prisma.projectMember.create({
        data: {
          userId: regularUser.id,
          projectId: project.id,
          projectRole: 'MAINTAINER'
        }
      });

      const result = await PermissionService.canManageProjectMembers(regularUser.id, project.id);
      expect(result).toBe(true);
    });

    it('should return false for regular users', async () => {
      const result = await PermissionService.canManageProjectMembers(regularUser.id, project.id);
      expect(result).toBe(false);
    });

    it('should return false for manager users without project permissions', async () => {
      const result = await PermissionService.canManageProjectMembers(managerUser.id, project.id);
      expect(result).toBe(false);
    });

    it('should return false for non-existent users', async () => {
      const result = await PermissionService.canManageProjectMembers('non-existent-id', project.id);
      expect(result).toBe(false);
    });
  });

  describe('requireAuth', () => {
    it('should return user when authenticated and active', () => {
      const result = PermissionService.requireAuth(adminUser);
      expect(result).toBe(adminUser);
    });

    it('should throw error when user is not authenticated', () => {
      expect(() => {
        PermissionService.requireAuth(undefined);
      }).toThrow(GraphQLError);
      expect(() => {
        PermissionService.requireAuth(undefined);
      }).toThrow('Authentication required');
    });

    it('should throw error when user is inactive', () => {
      const inactiveUser = { ...adminUser, isActive: false };
      expect(() => {
        PermissionService.requireAuth(inactiveUser);
      }).toThrow(GraphQLError);
      expect(() => {
        PermissionService.requireAuth(inactiveUser);
      }).toThrow('User account is inactive');
    });
  });

  describe('requireGlobalPermission', () => {
    it('should not throw when user has required permission', () => {
      expect(() => {
        PermissionService.requireGlobalPermission(adminUser, ['ADMIN']);
      }).not.toThrow();
    });

    it('should throw when user does not have required permission', () => {
      expect(() => {
        PermissionService.requireGlobalPermission(regularUser, ['ADMIN']);
      }).toThrow(GraphQLError);
      expect(() => {
        PermissionService.requireGlobalPermission(regularUser, ['ADMIN']);
      }).toThrow('No permission for this action');
    });

    it('should throw custom message when provided', () => {
      expect(() => {
        PermissionService.requireGlobalPermission(regularUser, ['ADMIN'], 'Custom error message');
      }).toThrow('Custom error message');
    });
  });

  describe('requireProjectPermission', () => {
    it('should not throw when user has required project permission', async () => {
      const prisma = getPrismaClient();
      await prisma.projectMember.create({
        data: {
          userId: regularUser.id,
          projectId: project.id,
          projectRole: 'OWNER'
        }
      });

      await expect(
        PermissionService.requireProjectPermission(regularUser.id, project.id, ['OWNER'])
      ).resolves.not.toThrow();
    });

    it('should throw when user does not have required project permission', async () => {
      await expect(
        PermissionService.requireProjectPermission(regularUser.id, project.id, ['OWNER'])
      ).rejects.toThrow(GraphQLError);
      await expect(
        PermissionService.requireProjectPermission(regularUser.id, project.id, ['OWNER'])
      ).rejects.toThrow('No permission for this action');
    });

    it('should throw custom message when provided', async () => {
      await expect(
        PermissionService.requireProjectPermission(regularUser.id, project.id, ['OWNER'], 'Custom project error')
      ).rejects.toThrow('Custom project error');
    });
  });
}); 