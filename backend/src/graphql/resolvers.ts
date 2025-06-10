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
    
    user: async (_: any, { id }: { id: string }) => {
      ValidationService.validateId(id, 'User ID');
      return prisma.user.findUnique({ where: { id } });
    },
    
    users: async (_: any, __: any, context: MercuriusContext) => {
      const user = PermissionService.requireAuth(context.user);
      PermissionService.requireGlobalPermission(
        user, 
        ['ADMIN'], 
        'Only admins can view all users'
      );
      return prisma.user.findMany();
    },

    project: async (_: any, { id }: { id: string }) => {
      ValidationService.validateId(id, 'Project ID');
      return prisma.project.findUnique({ where: { id } });
    },
    
    projects: async () => {
      return prisma.project.findMany();
    },

    issue: async (_: any, { id }: { id: string }) => {
      ValidationService.validateId(id, 'Issue ID');
      return prisma.issue.findUnique({ where: { id } });
    },
    
    issues: async (_: any, filters: any) => {
      const where: any = {};
      if (filters.projectId) where.projectId = filters.projectId;
      if (filters.status) where.status = filters.status;
      if (filters.priority) where.priority = filters.priority;
      if (filters.type) where.type = filters.type;
      if (filters.assigneeId) where.assigneeId = filters.assigneeId;

      return prisma.issue.findMany({ 
        where,
        include: {
          project: true,
          reporter: true,
          assignee: true,
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
      
      // Validation
      if (args.name) ValidationService.validateProjectName(args.name);
      if (args.description) args.description = ValidationService.sanitizeText(args.description);
      
      // Permission Check
      if (!PermissionService.hasGlobalPermission(user, ['ADMIN']) &&
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
      
      // Permission Check
      if (!PermissionService.hasGlobalPermission(user, ['ADMIN']) &&
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
      
      // Permission Check
      if (args.assigneeId !== undefined && !await PermissionService.canAssignIssues(user.id, issue.projectId)) {
        throw new GraphQLError('No permission to assign issues');
      }
      if (!await PermissionService.canEditIssue(user.id, args.id)) {
        throw new GraphQLError('No permission to edit this issue');
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
  },

  User: {
    issues: async (parent: any) => {
      return prisma.issue.findMany({ 
        where: { reporterId: parent.id },
        include: { project: true, assignee: true },
        orderBy: { updatedAt: 'desc' }
      });
    },
    assignedIssues: async (parent: any) => {
      return prisma.issue.findMany({ 
        where: { assigneeId: parent.id },
        include: { project: true, reporter: true },
        orderBy: { updatedAt: 'desc' }
      });
    },
    projects: async (parent: any) => {
      return prisma.project.findMany({
        where: { members: { some: { id: parent.id } } },
      });
    },
    projectMemberships: async (parent: any) => {
      return prisma.projectMember.findMany({ 
        where: { userId: parent.id },
        include: { project: true }
      });
    },
  },

  Project: {
    issues: async (parent: any) => {
      return prisma.issue.findMany({ 
        where: { projectId: parent.id },
        include: { reporter: true, assignee: true },
        orderBy: { createdAt: 'desc' }
      });
    },
    members: async (parent: any) => {
      return prisma.user.findMany({
        where: { projects: { some: { id: parent.id } } },
      });
    },
    projectMembers: async (parent: any) => {
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