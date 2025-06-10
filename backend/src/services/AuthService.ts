import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';

const prisma = new PrismaClient();

interface JWTPayload {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

export class AuthService {
  /**
   * Hash password with bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    return bcrypt.hash(password, rounds);
  }

  /**
   * Verify password
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generate JWT token
   */
  static generateToken(userId: string, role: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');

    return jwt.sign(
      { userId, role },
      secret,
      { expiresIn: '7d' }
    );
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JWTPayload {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');

    try {
      return jwt.verify(token, secret) as JWTPayload;
    } catch (error) {
      throw new GraphQLError('Invalid or expired token');
    }
  }

  /**
   * Login user
   */
  static async login(username: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user || !await this.verifyPassword(password, user.password)) {
      throw new GraphQLError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new GraphQLError('Account is inactive');
    }

    const token = this.generateToken(user.id, user.role);
    
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
  }

  /**
   * Get user from token
   */
  static async getUserFromToken(token: string) {
    const payload = this.verifyToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user || !user.isActive) {
      throw new GraphQLError('User not found or inactive');
    }

    return user;
  }
} 