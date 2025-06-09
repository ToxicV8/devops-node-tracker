import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';

const prisma = new PrismaClient();

// Types for permissions
interface User {
  id: string;
  role: 'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'USER';
  isActive: boolean;
}

export class PermissionService {
  /**
   * Checks global user permissions
   */
  static hasGlobalPermission(user: User, requiredRoles: string[]): boolean {
    return user.isActive && requiredRoles.includes(user.role);
  }

  /**
   * Checks project-specific permissions
   */
  static async hasProjectPermission(
    userId: string, 
    projectId: string, 
    requiredRoles: string[]
  ): Promise<boolean> {
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    return membership ? requiredRoles.includes(membership.projectRole) : false;
  }

  /**
   * Checks if user can assign issues
   */
  static async canAssignIssues(userId: string, projectId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;
    
    return this.hasGlobalPermission(user, ['ADMIN', 'MANAGER']) ||
           await this.hasProjectPermission(userId, projectId, ['OWNER', 'MAINTAINER']);
  }

  /**
   * Checks if user can edit an issue
   */
  static async canEditIssue(userId: string, issueId: string): Promise<boolean> {
    const issue = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) return false;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;
    
    // Issue reporter, assignee, or appropriate permission
    if (issue.reporterId === userId || issue.assigneeId === userId) return true;
    
    return this.hasGlobalPermission(user, ['ADMIN', 'MANAGER']) ||
           await this.hasProjectPermission(userId, issue.projectId, ['OWNER', 'MAINTAINER']);
  }

  /**
   * Checks if user can manage a project
   */
  static async canManageProject(userId: string, projectId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;
    
    return this.hasGlobalPermission(user, ['ADMIN']) ||
           await this.hasProjectPermission(userId, projectId, ['OWNER', 'MAINTAINER']);
  }

  /**
   * Checks if user can manage project members
   */
  static async canManageProjectMembers(userId: string, projectId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;
    
    return this.hasGlobalPermission(user, ['ADMIN']) ||
           await this.hasProjectPermission(userId, projectId, ['OWNER', 'MAINTAINER']);
  }

  /**
   * Requires authentication
   */
  static requireAuth(user?: User): User {
    if (!user) {
      throw new GraphQLError('Authentication required');
    }
    
    if (!user.isActive) {
      throw new GraphQLError('User account is inactive');
    }
    
    return user;
  }

  /**
   * Requires global permission
   */
  static requireGlobalPermission(user: User, requiredRoles: string[], message?: string): void {
    if (!this.hasGlobalPermission(user, requiredRoles)) {
      throw new GraphQLError(message || 'No permission for this action');
    }
  }

  /**
   * Requires project permission
   */
  static async requireProjectPermission(
    userId: string, 
    projectId: string, 
    requiredRoles: string[], 
    message?: string
  ): Promise<void> {
    if (!await this.hasProjectPermission(userId, projectId, requiredRoles)) {
      throw new GraphQLError(message || 'No permission for this action');
    }
  }
} 