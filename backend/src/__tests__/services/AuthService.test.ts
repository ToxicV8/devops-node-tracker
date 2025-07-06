import { AuthService } from '../../services/AuthService';
import { getPrismaClient, createTestUser, cleanDatabase } from '../helpers/graphqlTestUtils';
import bcrypt from 'bcrypt';

describe('AuthService', () => {
  let testUser: any;

  beforeAll(async () => {
    // Create test user
    testUser = await createTestUser({
      username: 'testuser',
      email: 'test@example.com',
      password: await AuthService.hashPassword('TestPassword123!'),
      role: 'USER'
    });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await AuthService.hashPassword(password);
      
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await AuthService.hashPassword(password);
      const hash2 = await AuthService.hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await AuthService.hashPassword(password);
      
      const isValid = await AuthService.verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hashedPassword = await AuthService.hashPassword(password);
      
      const isValid = await AuthService.verifyPassword(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate valid JWT token', () => {
      const userId = 'test-user-id';
      const role = 'USER';
      
      const token = AuthService.generateToken(userId, role);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should throw error if JWT_SECRET is not configured', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      expect(() => {
        AuthService.generateToken('test-user-id', 'USER');
      }).toThrow('JWT_SECRET not configured');
      
      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const userId = 'test-user-id';
      const role = 'USER';
      const token = AuthService.generateToken(userId, role);
      
      const payload = AuthService.verifyToken(token);
      
      expect(payload.userId).toBe(userId);
      expect(payload.role).toBe(role);
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        AuthService.verifyToken('invalid-token');
      }).toThrow('Invalid or expired token');
    });

    it('should throw error if JWT_SECRET is not configured', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      expect(() => {
        AuthService.verifyToken('valid-token');
      }).toThrow('JWT_SECRET not configured');
      
      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('login', () => {
    it('should login with correct credentials', async () => {
      const result = await AuthService.login('testuser', 'TestPassword123!');
      
      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(testUser.id);
      expect(result.user.username).toBe('testuser');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.role).toBe('USER');
    });

    it('should throw error for incorrect username', async () => {
      await expect(
        AuthService.login('nonexistentuser', 'TestPassword123!')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for incorrect password', async () => {
      await expect(
        AuthService.login('testuser', 'WrongPassword123!')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for inactive user', async () => {
      // Create inactive user
      const inactiveUser = await createTestUser({
        username: 'inactiveuser',
        email: 'inactive@example.com',
        password: await AuthService.hashPassword('TestPassword123!'),
        isActive: false
      });

      await expect(
        AuthService.login('inactiveuser', 'TestPassword123!')
      ).rejects.toThrow('Account is inactive');

      // Clean up
      const prisma = getPrismaClient();
      await prisma.user.delete({ where: { id: inactiveUser.id } });
    });
  });

  describe('getUserFromToken', () => {
    it('should get user from valid token', async () => {
      const token = AuthService.generateToken(testUser.id, testUser.role);
      const user = await AuthService.getUserFromToken(token);
      
      expect(user.id).toBe(testUser.id);
      expect(user.username).toBe(testUser.username);
      expect(user.email).toBe(testUser.email);
    });

    it('should throw error for invalid token', async () => {
      await expect(
        AuthService.getUserFromToken('invalid-token')
      ).rejects.toThrow('Invalid or expired token');
    });

    it('should throw error for non-existent user', async () => {
      const token = AuthService.generateToken('clx1234567890123456789012', 'USER'); // Valid CUID format but non-existent
      
      await expect(
        AuthService.getUserFromToken(token)
      ).rejects.toThrow('User not found or inactive');
    });

    it('should throw error for inactive user', async () => {
      // Create inactive user
      const inactiveUser = await createTestUser({
        username: 'inactiveuser2',
        email: 'inactive2@example.com',
        password: await AuthService.hashPassword('TestPassword123!'),
        isActive: false
      });

      const token = AuthService.generateToken(inactiveUser.id, inactiveUser.role);
      
      await expect(
        AuthService.getUserFromToken(token)
      ).rejects.toThrow('User not found or inactive');

      // Clean up
      const prisma = getPrismaClient();
      await prisma.user.delete({ where: { id: inactiveUser.id } });
    });
  });
}); 