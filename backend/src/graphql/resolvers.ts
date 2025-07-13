import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { MercuriusContext } from 'mercurius';
import { PermissionService } from '../services/PermissionService';
import { ValidationService } from '../services/ValidationService';
import { AuthService } from '../services/AuthService';

const prisma = new PrismaClient();

// Types
interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
  role: 'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'USER';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

declare module 'mercurius' {
  interface MercuriusContext {
    user?: User;
  }
}

export const resolvers = {
  Query: {
    me: async (_: any, __: any, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      return prisma.user.findUnique({ where: { id: user.id } });
    },
    
    user: async (_: any, { id }: { id: string }, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      ValidationService.validateId(id, 'User ID');
      
      // Admins can see all users, others only themselves
      if (id !== user.id && !PermissionService.hasGlobalPermission(user, ['ADMIN'])) {
        throw new GraphQLError('No permission to view this user');
      }
      
      return prisma.user.findUnique({ where: { id } });
    },
    
    users: async (_: any, __: any, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      PermissionService.requireGlobalPermission(
        user, 
        ['ADMIN', 'MANAGER'], 
        'Only admins and managers can view all users'
      );
      return prisma.user.findMany();
    },

    project: async (_: any, { id }: { id: string }, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      ValidationService.validateId(id, 'Project ID');
      
      // Check if user has access to the project
      const hasAccess = PermissionService.hasGlobalPermission(user, ['ADMIN', 'MANAGER']) ||
                       await PermissionService.hasProjectPermission(user.id, id, ['OWNER', 'MAINTAINER', 'DEVELOPER', 'REPORTER', 'MEMBER']);
      
      if (!hasAccess) {
        throw new GraphQLError('No permission to view this project');
      }
      
      return prisma.project.findUnique({ where: { id } });
    },
    
    projects: async (_: any, __: any, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      
      // Role-based project access
      if (PermissionService.hasGlobalPermission(user, ['ADMIN', 'MANAGER'])) {
        // Admins and Managers see all projects
        return prisma.project.findMany({
          include: {
            projectMembers: {
              include: {
                user: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
      } else if (user.role === 'DEVELOPER') {
        // Developers see projects where they are members
        return prisma.project.findMany({
          where: {
            OR: [
              { ownerId: user.id },
              { projectMembers: { some: { userId: user.id } } }
            ]
          },
          include: {
            projectMembers: {
              include: {
                user: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
      } else {
        // Regular users only see projects they own or are members of
        return prisma.project.findMany({
          where: {
            OR: [
              { ownerId: user.id },
              { projectMembers: { some: { userId: user.id } } }
            ]
          },
          include: {
            projectMembers: {
              include: {
                user: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
      }
    },

    issue: async (_: any, { id }: { id: string }, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      ValidationService.validateId(id, 'Issue ID');
      
      const issue = await prisma.issue.findUnique({ 
        where: { id },
        include: { project: true }
      });
      
      if (!issue) {
        throw new GraphQLError('Issue not found');
      }
      
      // Check access to the project
      const hasAccess = PermissionService.hasGlobalPermission(user, ['ADMIN', 'MANAGER']) ||
                       await PermissionService.hasProjectPermission(user.id, issue.projectId, ['OWNER', 'MAINTAINER', 'DEVELOPER', 'REPORTER', 'MEMBER']) ||
                       issue.reporterId === user.id ||
                       issue.assigneeId === user.id;
      
      if (!hasAccess) {
        throw new GraphQLError('No permission to view this issue');
      }
      
      return prisma.issue.findUnique({ 
        where: { id },
        include: {
          project: true,
          reporter: true,
          assignee: true,
        }
      });
    },
    
    issues: async (_: any, filters: any, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      
      const where: any = {};
      
      // Filter by project ID
      if (filters.projectId) {
        ValidationService.validateId(filters.projectId, 'Project ID');
        
        // Check access to the project
        const hasAccess = PermissionService.hasGlobalPermission(user, ['ADMIN', 'MANAGER']) ||
                         await PermissionService.hasProjectPermission(user.id, filters.projectId, ['OWNER', 'MAINTAINER', 'DEVELOPER', 'REPORTER', 'MEMBER']);
        
        if (!hasAccess) {
          throw new GraphQLError('No permission to view issues in this project');
        }
        
        where.projectId = filters.projectId;
      } else {
        // If no project specified, apply role-based filtering
        if (PermissionService.hasGlobalPermission(user, ['ADMIN', 'MANAGER'])) {
          // Admins and Managers see all issues
          // No additional filtering needed
        } else if (user.role === 'DEVELOPER') {
          // Developers see issues from projects where they are members
          const userProjects = await prisma.project.findMany({
            where: {
              OR: [
                { ownerId: user.id },
                { projectMembers: { some: { userId: user.id } } }
              ]
            },
            select: { id: true }
          });
          
          const projectIds = userProjects.map(p => p.id);
          if (projectIds.length === 0) {
            return []; // No projects = no issues
          }
          
          where.projectId = { in: projectIds };
        } else {
          // Regular users only see their own issues (reported or assigned)
          where.OR = [
            { reporterId: user.id },
            { assigneeId: user.id }
          ];
        }
      }
      
      // Additional filters
      if (filters.status) where.status = filters.status;
      if (filters.priority) where.priority = filters.priority;
      if (filters.type) where.type = filters.type;
      if (filters.assigneeId) {
        ValidationService.validateId(filters.assigneeId, 'Assignee ID');
        where.assigneeId = filters.assigneeId;
      }
      if (filters.reporterId) {
        ValidationService.validateId(filters.reporterId, 'Reporter ID');
        where.reporterId = filters.reporterId;
      }

      return prisma.issue.findMany({ 
        where,
        include: {
          project: true,
          reporter: true,
          assignee: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    },
  },

  Mutation: {
    login: async (_: any, { username, password }: { username: string, password: string }) => {
      return AuthService.login(username, password);
    },

    register: async (_: any, args: any) => {
      ValidationService.validateUsername(args.username);
      ValidationService.validateEmail(args.email);
      ValidationService.validatePassword(args.password);

      // Check if user exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: args.username },
            { email: args.email }
          ]
        }
      });

      if (existingUser) {
        throw new GraphQLError('Username or email already exists');
      }

      // Hash password
      const hashedPassword = await AuthService.hashPassword(args.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          username: args.username,
          email: args.email,
          password: hashedPassword,
          name: args.name ? ValidationService.sanitizeText(args.name) : null,
          role: 'USER', // Default role
        },
      });

      // Generate token
      const token = AuthService.generateToken(user.id, user.role);

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive
        }
      };
    },

    changePassword: async (_: any, { currentPassword, newPassword }: { currentPassword: string, newPassword: string }, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      ValidationService.validatePassword(newPassword);

      // Get current user with password
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id }
      });

      if (!currentUser) {
        throw new GraphQLError('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await AuthService.verifyPassword(currentPassword, currentUser.password);
      if (!isCurrentPasswordValid) {
        throw new GraphQLError('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await AuthService.hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword }
      });

      return true;
    },

    createUser: async (_: any, args: any, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      
      // Validation
      ValidationService.validateUsername(args.username);
      ValidationService.validateEmail(args.email);
      ValidationService.validatePassword(args.password);
      
      // Permission Check
      if (args.role && args.role !== 'USER') {
        PermissionService.requireGlobalPermission(
          user, 
          ['ADMIN'], 
          'Only admins can assign roles'
        );
      }

      // Check if User Already Exists
      const existingUser = await prisma.user.findUnique({
        where: {
          username: args.username,
          OR: [
            { email: args.email }
          ]
        }
      });

      if (existingUser) {
        throw new GraphQLError('Username or email already exists');
      }

      // Only Admins Can Create Users
      PermissionService.requireGlobalPermission(
        user,
        ['ADMIN'],
        'Only admins can create users'
      );

      const hashedPassword = await AuthService.hashPassword(args.password);

      return prisma.user.create({
        data: {
          username: args.username,
          email: args.email,
          password: hashedPassword,
          name: args.name ? ValidationService.sanitizeText(args.name) : null,
          role: args.role || 'USER',
        },
      });
    },

    updateUser: async (_: any, args: any, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      ValidationService.validateId(args.id, 'User ID');
      
      // Check if user exists before permission checks
      const existingUser = await prisma.user.findUnique({ where: { id: args.id } });
      if (!existingUser) {
        throw new GraphQLError('User not found');
      }
      
      // Validation
      if (args.username) ValidationService.validateUsername(args.username);
      if (args.email) ValidationService.validateEmail(args.email);
      if (args.name) args.name = ValidationService.sanitizeText(args.name);
      
      // Permission Check
      if (args.id !== user.id) {
        PermissionService.requireGlobalPermission(user, ['ADMIN'], 'No permission to update this user');
      }
      if (args.role) {
        PermissionService.requireGlobalPermission(user, ['ADMIN'], 'No permission to change role');
        if (args.role === 'ADMIN' && user.role !== 'ADMIN') {
          throw new GraphQLError('Only admins can assign admin role');
        }
      }

      const updateData: any = {};
      if (args.username !== undefined) updateData.username = args.username;
      if (args.email !== undefined) updateData.email = args.email;
      if (args.name !== undefined) updateData.name = args.name;
      if (args.role !== undefined) updateData.role = args.role;
      if (args.isActive !== undefined) updateData.isActive = args.isActive;

      return prisma.user.update({
        where: { id: args.id },
        data: updateData,
      });
    },

    deleteUser: async (_: any, { id }: { id: string }, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      ValidationService.validateId(id, 'User ID');
      PermissionService.requireGlobalPermission(user, ['ADMIN'], 'Only admins can delete users');

      // Check if user exists before attempting to delete
      const existingUser = await prisma.user.findUnique({ where: { id } });
      if (!existingUser) {
        throw new GraphQLError('User not found');
      }

      await prisma.user.delete({ where: { id } });
      return true;
    },

    createProject: async (_: any, args: any, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      
      ValidationService.validateProjectName(args.name);
      PermissionService.requireGlobalPermission(
        user, 
        ['ADMIN'], 
        'Only admins can create projects'
      );

      const project = await prisma.project.create({
        data: { 
          name: args.name, 
          description: args.description ? ValidationService.sanitizeText(args.description) : null,
          ownerId: user.id,
        },
      });

      // Add Creator as Owner
      await prisma.projectMember.create({
        data: {
          userId: user.id,
          projectId: project.id,
          projectRole: 'OWNER',
        },
      });

      return project;
    },

    updateProject: async (_: any, args: any, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      ValidationService.validateId(args.id, 'Project ID');
      
      // Check if project exists before permission checks
      const existingProject = await prisma.project.findUnique({ where: { id: args.id } });
      if (!existingProject) {
        throw new GraphQLError('Project not found');
      }
      
      // Validation
      if (args.name) ValidationService.validateProjectName(args.name);
      if (args.description) args.description = ValidationService.sanitizeText(args.description);
      
      // Permission Check
      if (!PermissionService.hasGlobalPermission(user, ['ADMIN', 'MANAGER']) &&
          !await PermissionService.hasProjectPermission(user.id, args.id, ['OWNER', 'MAINTAINER'])) {
        throw new GraphQLError('No permission to update this project');
      }

      return prisma.project.update({
        where: { id: args.id },
        data: { name: args.name, description: args.description },
      });
    },

    deleteProject: async (_: any, { id }: { id: string }, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      ValidationService.validateId(id, 'Project ID');
      
      // Check if project exists before permission checks
      const existingProject = await prisma.project.findUnique({ where: { id } });
      if (!existingProject) {
        throw new GraphQLError('Project not found');
      }
      
      // Permission Check
      if (!PermissionService.hasGlobalPermission(user, ['ADMIN', 'MANAGER']) &&
          !await PermissionService.hasProjectPermission(user.id, id, ['OWNER'])) {
        throw new GraphQLError('Only project owners can delete projects');
      }

      await prisma.project.delete({ where: { id } });
      return true;
    },

    createIssue: async (_: any, args: any, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      
      ValidationService.validateIssueTitle(args.title);
      ValidationService.validateId(args.projectId, 'Project ID');
      
      // Permission Check - role-based access
      let canCreate = false;
      
      if (PermissionService.hasGlobalPermission(user, ['ADMIN', 'MANAGER'])) {
        // Admins and Managers can create issues in any project
        canCreate = true;
      } else if (user.role === 'DEVELOPER') {
        // Developers can create issues in projects where they are members
        canCreate = await PermissionService.hasProjectPermission(user.id, args.projectId, ['OWNER', 'MAINTAINER', 'DEVELOPER', 'REPORTER', 'MEMBER']);
      } else {
        // Regular users can only create issues in projects where they are members
        canCreate = await PermissionService.hasProjectPermission(user.id, args.projectId, ['OWNER', 'MAINTAINER', 'DEVELOPER', 'REPORTER', 'MEMBER']);
      }
      
      if (!canCreate) {
        throw new GraphQLError('No permission to create issues in this project');
      }
      
      // Assignment permission check
      if (args.assigneeId && !await PermissionService.canAssignIssues(user.id, args.projectId)) {
        throw new GraphQLError('No permission to assign issues');
      }
      
      return prisma.issue.create({
        data: {
          title: args.title,
          description: args.description ? ValidationService.sanitizeText(args.description) : null,
          status: args.status,
          priority: args.priority,
          type: args.type,
          project: { connect: { id: args.projectId } },
          reporter: { connect: { id: user.id } },
          ...(args.assigneeId && { assignee: { connect: { id: args.assigneeId } } }),
        },
        include: {
          project: true,
          reporter: true,
          assignee: true,
        }
      });
    },

    updateIssue: async (_: any, args: any, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      ValidationService.validateId(args.id, 'Issue ID');
      
      // Validation
      if (args.title) ValidationService.validateIssueTitle(args.title);
      if (args.description !== undefined) args.description = ValidationService.sanitizeText(args.description);
      if (args.assigneeId) ValidationService.validateId(args.assigneeId, 'Assignee ID');
      
      const issue = await prisma.issue.findUnique({ where: { id: args.id } });
      if (!issue) throw new GraphQLError('Issue not found');
      
      // Enhanced permission check
      let canEdit = false;
      
      if (PermissionService.hasGlobalPermission(user, ['ADMIN', 'MANAGER'])) {
        // Admins and Managers can edit any issue
        canEdit = true;
      } else if (user.role === 'DEVELOPER') {
        // Developers can edit issues in their projects or issues assigned to them
        canEdit = await PermissionService.hasProjectPermission(user.id, issue.projectId, ['OWNER', 'MAINTAINER', 'DEVELOPER']) ||
                  issue.assigneeId === user.id ||
                  issue.reporterId === user.id;
      } else {
        // Regular users can only edit their own issues (reported or assigned)
        canEdit = issue.reporterId === user.id || issue.assigneeId === user.id;
      }
      
      if (!canEdit) {
        throw new GraphQLError('No permission to edit this issue');
      }
      
      // Assignment permission check
      if (args.assigneeId !== undefined && !await PermissionService.canAssignIssues(user.id, issue.projectId)) {
        throw new GraphQLError('No permission to assign issues');
      }

      const updateData: any = {};
      if (args.title !== undefined) updateData.title = args.title;
      if (args.description !== undefined) updateData.description = args.description;
      if (args.status !== undefined) updateData.status = args.status;
      if (args.priority !== undefined) updateData.priority = args.priority;
      if (args.type !== undefined) updateData.type = args.type;
      if (args.assigneeId !== undefined) {
        updateData.assignee = args.assigneeId ? { connect: { id: args.assigneeId } } : { disconnect: true };
      }

      return prisma.issue.update({
        where: { id: args.id },
        data: updateData,
        include: {
          project: true,
          reporter: true,
          assignee: true,
        }
      });
    },

    createComment: async (_: any, args: any, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      
      ValidationService.validateId(args.issueId, 'Issue ID');
      ValidationService.validateCommentContent(args.content);
      
      // Get the issue to check permissions
      const issue = await prisma.issue.findUnique({ 
        where: { id: args.issueId },
        include: { project: true }
      });
      
      if (!issue) {
        throw new GraphQLError('Issue not found');
      }
      
      // Permission Check - only project members can comment
      const canComment = PermissionService.hasGlobalPermission(user, ['ADMIN', 'MANAGER']) ||
                        await PermissionService.hasProjectPermission(user.id, issue.projectId, ['OWNER', 'MAINTAINER', 'DEVELOPER', 'REPORTER', 'MEMBER']) ||
                        issue.reporterId === user.id ||
                        issue.assigneeId === user.id;
      
      if (!canComment) {
        throw new GraphQLError('No permission to comment on this issue');
      }
      
      return prisma.comment.create({
        data: {
          content: ValidationService.sanitizeText(args.content),
          issue: { connect: { id: args.issueId } },
          author: { connect: { id: user.id } },
        },
        include: {
          author: true,
          issue: true,
        }
      });
    },

    // Project Member Management
    addProjectMember: async (_: any, args: any, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      
      ValidationService.validateId(args.projectId, 'Project ID');
      ValidationService.validateId(args.userId, 'User ID');
      
      // Permission Check - only Admins or Project Owner/Maintainer can add members
      if (!PermissionService.hasGlobalPermission(user, ['ADMIN', 'MANAGER']) &&
          !await PermissionService.hasProjectPermission(user.id, args.projectId, ['OWNER', 'MAINTAINER'])) {
        throw new GraphQLError('No permission to add project members');
      }
      
      // Check if user is already a member
      const existingMember = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: args.userId,
            projectId: args.projectId
          }
        }
      });
      
      if (existingMember) {
        throw new GraphQLError('User is already a member of this project');
      }
      
      return prisma.projectMember.create({
        data: {
          userId: args.userId,
          projectId: args.projectId,
          projectRole: args.projectRole || 'MEMBER',
        },
        include: {
          user: true,
          project: true,
        }
      });
    },

    updateProjectMemberRole: async (_: any, args: any, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      
      ValidationService.validateId(args.projectId, 'Project ID');
      ValidationService.validateId(args.userId, 'User ID');
      
      // Check if project member exists
      const projectMember = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: args.userId,
            projectId: args.projectId
          }
        }
      });
      
      if (!projectMember) {
        throw new GraphQLError('Project member not found');
      }
      
      // Permission Check - only Admins or Project Owner can change roles
      if (!PermissionService.hasGlobalPermission(user, ['ADMIN']) &&
          !await PermissionService.hasProjectPermission(user.id, args.projectId, ['OWNER'])) {
        throw new GraphQLError('No permission to update project member roles');
      }
      
      // Prevent user from changing their own role
      if (args.userId === user.id) {
        throw new GraphQLError('Cannot change your own project role');
      }
      
      return prisma.projectMember.update({
        where: {
          userId_projectId: {
            userId: args.userId,
            projectId: args.projectId
          }
        },
        data: {
          projectRole: args.projectRole,
        },
        include: {
          user: true,
          project: true,
        }
      });
    },

    removeProjectMember: async (_: any, args: any, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      
      ValidationService.validateId(args.projectId, 'Project ID');
      ValidationService.validateId(args.userId, 'User ID');
      
      // Check if project member exists
      const projectMember = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: args.userId,
            projectId: args.projectId
          }
        }
      });
      
      if (!projectMember) {
        throw new GraphQLError('Project member not found');
      }
      
      // Permission Check - only Admins or Project Owner can remove members
      if (!PermissionService.hasGlobalPermission(user, ['ADMIN']) &&
          !await PermissionService.hasProjectPermission(user.id, args.projectId, ['OWNER'])) {
        throw new GraphQLError('No permission to remove project members');
      }
      
      // Prevent user from removing themselves
      if (args.userId === user.id) {
        throw new GraphQLError('Cannot remove yourself from project');
      }
      
      await prisma.projectMember.delete({
        where: {
          userId_projectId: {
            userId: args.userId,
            projectId: args.projectId
          }
        }
      });
      
      return true;
    },

    // Issue Management
    deleteIssue: async (_: any, { id }: { id: string }, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      ValidationService.validateId(id, 'Issue ID');
      
      const issue = await prisma.issue.findUnique({ where: { id } });
      if (!issue) {
        throw new GraphQLError('Issue not found');
      }
      
      // Permission Check - only Admins, Managers, or Project Owner/Maintainer can delete issues
      // Normal users cannot delete their own issues, they should close them instead
      const canDelete = PermissionService.hasGlobalPermission(user, ['ADMIN', 'MANAGER']) ||
                       await PermissionService.hasProjectPermission(user.id, issue.projectId, ['OWNER', 'MAINTAINER']);
      
      if (!canDelete) {
        throw new GraphQLError('No permission to delete this issue');
      }
      
      await prisma.issue.delete({ where: { id } });
      return true;
    },

    // Comment Management
    updateComment: async (_: any, args: any, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      ValidationService.validateId(args.id, 'Comment ID');
      ValidationService.validateCommentContent(args.content);
      
      const comment = await prisma.comment.findUnique({ 
        where: { id: args.id },
        include: { issue: true }
      });
      
      if (!comment) {
        throw new GraphQLError('Comment not found');
      }
      
      // Permission Check - only Comment Author or Project Owner/Admin can edit
      const canEdit = PermissionService.hasGlobalPermission(user, ['ADMIN']) ||
                     await PermissionService.hasProjectPermission(user.id, comment.issue.projectId, ['OWNER', 'MAINTAINER']) ||
                     comment.authorId === user.id;
      
      if (!canEdit) {
        throw new GraphQLError('No permission to edit this comment');
      }
      
      return prisma.comment.update({
        where: { id: args.id },
        data: {
          content: ValidationService.sanitizeText(args.content),
        },
        include: {
          author: true,
          issue: true,
        }
      });
    },

    deleteComment: async (_: any, { id }: { id: string }, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      ValidationService.validateId(id, 'Comment ID');
      
      const comment = await prisma.comment.findUnique({ 
        where: { id },
        include: { issue: true }
      });
      
      if (!comment) {
        throw new GraphQLError('Comment not found');
      }
      
      // Permission Check - only Comment Author or Project Owner/Admin can delete
      const canDelete = PermissionService.hasGlobalPermission(user, ['ADMIN']) ||
                       await PermissionService.hasProjectPermission(user.id, comment.issue.projectId, ['OWNER', 'MAINTAINER']) ||
                       comment.authorId === user.id;
      
      if (!canDelete) {
        throw new GraphQLError('No permission to delete this comment');
      }
      
      await prisma.comment.delete({ where: { id } });
      return true;
    },
  },

  User: {
    issues: async (parent: any, __: any, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      
      // Users can only see their own issues, admins see all
      if (parent.id !== user.id && !PermissionService.hasGlobalPermission(user, ['ADMIN'])) {
        return [];
      }
      
      return prisma.issue.findMany({ 
        where: { reporterId: parent.id },
        include: { project: true, assignee: true },
        orderBy: { updatedAt: 'desc' }
      });
    },
    assignedIssues: async (parent: any, __: any, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      
      // Users can only see their own assigned issues, admins see all
      if (parent.id !== user.id && !PermissionService.hasGlobalPermission(user, ['ADMIN'])) {
        return [];
      }
      
      return prisma.issue.findMany({ 
        where: { assigneeId: parent.id },
        include: { project: true, reporter: true },
        orderBy: { updatedAt: 'desc' }
      });
    },
    projects: async (parent: any, __: any, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      
      // Users can only see their own projects, admins see all
      if (parent.id !== user.id && !PermissionService.hasGlobalPermission(user, ['ADMIN'])) {
        return [];
      }
      
      return prisma.project.findMany({
        where: { projectMembers: { some: { userId: parent.id } } },
      });
    },
    projectMemberships: async (parent: any, __: any, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      
      // Users can only see their own memberships, admins see all
      if (parent.id !== user.id && !PermissionService.hasGlobalPermission(user, ['ADMIN'])) {
        return [];
      }
      
      return prisma.projectMember.findMany({ 
        where: { userId: parent.id },
        include: { project: true }
      });
    },
  },

  Project: {
    issues: async (parent: any, __: any, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      
      // Check if user has access to the project
      const hasAccess = PermissionService.hasGlobalPermission(user, ['ADMIN']) ||
                       await PermissionService.hasProjectPermission(user.id, parent.id, ['OWNER', 'MAINTAINER', 'DEVELOPER', 'REPORTER', 'MEMBER']);
      
      if (!hasAccess) {
        return [];
      }
      
      return prisma.issue.findMany({ 
        where: { projectId: parent.id },
        include: { reporter: true, assignee: true },
        orderBy: { createdAt: 'desc' }
      });
    },
    members: async (parent: any, __: any, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      
      // Check if user has access to the project
      const hasAccess = PermissionService.hasGlobalPermission(user, ['ADMIN']) ||
                       await PermissionService.hasProjectPermission(user.id, parent.id, ['OWNER', 'MAINTAINER', 'DEVELOPER', 'REPORTER', 'MEMBER']);
      
      if (!hasAccess) {
        return [];
      }
      
      return prisma.user.findMany({
        where: { projectMemberships: { some: { projectId: parent.id } } },
      });
    },
    projectMembers: async (parent: any, __: any, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      
      // Check if user has access to the project
      const hasAccess = PermissionService.hasGlobalPermission(user, ['ADMIN']) ||
                       await PermissionService.hasProjectPermission(user.id, parent.id, ['OWNER', 'MAINTAINER', 'DEVELOPER', 'REPORTER', 'MEMBER']);
      
      if (!hasAccess) {
        return [];
      }
      
      return prisma.projectMember.findMany({ 
        where: { projectId: parent.id },
        include: { user: true },
        orderBy: { joinedAt: 'asc' }
      });
    },
  },

  Issue: {
    project: async (parent: any) => {
      return prisma.project.findUnique({ where: { id: parent.projectId } });
    },
    reporter: async (parent: any) => {
      return prisma.user.findUnique({ where: { id: parent.reporterId } });
    },
    assignee: async (parent: any) => {
      if (!parent.assigneeId) return null;
      return prisma.user.findUnique({ where: { id: parent.assigneeId } });
    },
    comments: async (parent: any) => {
      return prisma.comment.findMany({ 
        where: { issueId: parent.id },
        include: { author: true },
        orderBy: { createdAt: 'asc' }
      });
    },
  },

  Comment: {
    author: async (parent: any) => {
      return prisma.user.findUnique({ where: { id: parent.authorId } });
    },
    issue: async (parent: any) => {
      return prisma.issue.findUnique({ where: { id: parent.issueId } });
    },
  },

  ProjectMember: {
    user: async (parent: any) => {
      return prisma.user.findUnique({ where: { id: parent.userId } });
    },
    project: async (parent: any) => {
      return prisma.project.findUnique({ where: { id: parent.projectId } });
    },
  },
}; 