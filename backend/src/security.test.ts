import { test, expect } from '@jest/globals';
import fastify from 'fastify';
import { AuthService } from './services/AuthService';

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key-for-testing-only-32-chars';
process.env.RATE_LIMIT_MAX = '10';
process.env.RATE_LIMIT_WINDOW = '1';
process.env.CORS_ORIGIN = 'http://localhost:3000';

describe('Security Measures', () => {
  let app: any;

  beforeAll(async () => {
    // Create test app with security measures
    app = fastify();
    
    // Register security plugins
    await app.register(require('@fastify/helmet'));
    await app.register(require('@fastify/cors'), {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true,
    });
    await app.register(require('@fastify/rate-limit'), {
      max: parseInt(process.env.RATE_LIMIT_MAX || '10'),
      timeWindow: `${process.env.RATE_LIMIT_WINDOW || '1'} minute`,
    });

    // Test endpoint
    app.get('/test', async () => ({ message: 'test' }));
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Rate Limiting', () => {
    test('should allow requests within limit', async () => {
      const responses = [];
      
      // Make 5 requests (within limit of 10)
      for (let i = 0; i < 5; i++) {
        const response = await app.inject({
          method: 'GET',
          url: '/test'
        });
        responses.push(response.statusCode);
      }
      
      // All should be 200
      responses.forEach(status => {
        expect(status).toBe(200);
      });
    });

    test('should block requests over limit', async () => {
      // Make 15 requests (over limit of 10)
      const responses = [];
      
      for (let i = 0; i < 15; i++) {
        const response = await app.inject({
          method: 'GET',
          url: '/test'
        });
        responses.push(response.statusCode);
      }
      
      // Some should be 429 (Too Many Requests)
      const has429 = responses.some(status => status === 429);
      expect(has429).toBe(true);
    });
  });

  describe('CORS Headers', () => {
    test('should include CORS headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test',
        headers: {
          'Origin': 'http://localhost:3000'
        }
      });
      
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    test('should reject unauthorized origins', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test',
        headers: {
          'Origin': 'http://malicious-site.com'
        }
      });
      
      // Should not include CORS headers for unauthorized origin
      expect(response.headers['access-control-allow-origin']).not.toBe('http://malicious-site.com');
    });
  });

  describe('Security Headers', () => {
    test('should include security headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test'
      });
      
      // Check for essential security headers
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });

    test('should prevent clickjacking', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test'
      });
      
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    });
  });

  describe('JWT Security', () => {
    test('should generate valid tokens', () => {
      const token = AuthService.generateToken('test-user-id', 'USER');
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    test('should verify valid tokens', () => {
      const token = AuthService.generateToken('test-user-id', 'USER');
      const payload = AuthService.verifyToken(token);
      
      expect(payload.userId).toBe('test-user-id');
      expect(payload.role).toBe('USER');
    });

    test('should reject invalid tokens', () => {
      expect(() => {
        AuthService.verifyToken('invalid-token');
      }).toThrow('Invalid or expired token');
    });

    test('should hash passwords securely', async () => {
      const password = 'testPassword123';
      const hashed = await AuthService.hashPassword(password);
      
      expect(hashed).not.toBe(password);
      expect(hashed).toMatch(/^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/); // bcrypt format
    });

    test('should verify passwords correctly', async () => {
      const password = 'testPassword123';
      const hashed = await AuthService.hashPassword(password);
      
      const isValid = await AuthService.verifyPassword(password, hashed);
      expect(isValid).toBe(true);
      
      const isInvalid = await AuthService.verifyPassword('wrongPassword', hashed);
      expect(isInvalid).toBe(false);
    });
  });
}); 