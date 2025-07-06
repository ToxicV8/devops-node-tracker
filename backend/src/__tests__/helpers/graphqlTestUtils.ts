import { createTestClient, createAuthenticatedClient } from './testClient';

// Helper to get global Prisma instance
export const getPrismaClient = () => global.testUtils.prisma;

// Helper to create test users
export const createTestUser = async (userData?: any) => {
  return global.testUtils.createTestUser(userData);
};

// Helper to create test projects
export const createTestProject = async (projectData?: any) => {
  return global.testUtils.createTestProject(projectData);
};

// Helper to create test issues
export const createTestIssue = async (issueData: any) => {
  return global.testUtils.createTestIssue(issueData);
};

// Helper to create test comments
export const createTestComment = async (commentData: any) => {
  return global.testUtils.createTestComment(commentData);
};

// Helper to clean database
export const cleanDatabase = async () => {
  return global.testUtils.cleanDatabase();
};

// Helper to create test clients
export const createGraphQLTestClient = async () => {
  return createTestClient();
};

export const createGraphQLAuthenticatedClient = async (userId: string) => {
  return createAuthenticatedClient(userId);
};

// Helper to disconnect Prisma (not needed anymore as it's handled globally)
export const disconnectPrisma = async () => {
  // Prisma is disconnected globally in setup.ts
}; 