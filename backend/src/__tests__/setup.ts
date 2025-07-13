import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Don't create PrismaClient here - we'll create it after setting environment variables
let prisma: PrismaClient;

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test_envd@localhost:5432/test_db';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.BCRYPT_ROUNDS = '4'; // Faster for tests
  
  // Create PrismaClient AFTER setting environment variables
  prisma = new PrismaClient(); 

  // Clean database before all tests
  await global.testUtils.cleanDatabase();
});

// Global test teardown
afterAll(async () => {
  // Cleanup
  await prisma.$disconnect();
});

// Global test utilities
global.testUtils = {
  // Global Prisma instance - will be set in beforeAll
  get prisma() { return prisma; },

  // Helper to create test data
  createTestUser: async (userData?: any) => {
    return prisma.user.create({
      data: {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'TestPassword123!',
        name: 'Test User',
        role: 'USER',
        ...userData
      }
    });
  },

  // Helper to create test project
  createTestProject: async (projectData?: any) => {
    return prisma.project.create({
      data: {
        name: `Test Project ${Date.now()}`,
        description: 'Test project description',
        ...projectData
      }
    });
  },

  // Helper to create test issue
  createTestIssue: async (issueData: any) => {
    return prisma.issue.create({
      data: {
        title: `Test Issue ${Date.now()}`,
        description: 'Test issue description',
        status: 'TODO',
        priority: 'MEDIUM',
        type: 'TASK',
        ...issueData
      }
    });
  },

  // Helper to create test comment
  createTestComment: async (commentData: any) => {
    return prisma.comment.create({
      data: {
        content: `Test Comment ${Date.now()}`,
        ...commentData
      }
    });
  },

  // Helper to clean database
  cleanDatabase: async () => {
    try {
      // Delete all data from tables in correct order
      await prisma.comment.deleteMany();
      await prisma.issue.deleteMany();
      await prisma.projectMember.deleteMany();
      await prisma.project.deleteMany();
      await prisma.user.deleteMany();
    } catch (error) {
      console.log({ error });
    }
  }
};

// Extend global types
declare global {
  var testUtils: {
    prisma: PrismaClient;
    createTestUser: (userData?: any) => Promise<any>;
    createTestProject: (projectData?: any) => Promise<any>;
    createTestIssue: (issueData: any) => Promise<any>;
    createTestComment: (commentData: any) => Promise<any>;
    cleanDatabase: () => Promise<void>;
  };
} 