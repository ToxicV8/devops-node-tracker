import { GraphQLError } from 'graphql';
import validator from 'validator';

export class ValidationService {
  /**
   * Validates Email Format
   */
  static validateEmail(email: string): void {

    if (!validator.isEmail(email)) {
      throw new GraphQLError('Invalid Email Format');
    }
  }

  /**
   * Validates Password Strength
   */
  static validatePassword(password: string): void {
    if (password.length < 8) {
      throw new GraphQLError('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new GraphQLError('Password must contain uppercase and lowercase letters and numbers');
    }
  }

  /**
   * Validates username
   */
  static validateUsername(username: string): void {
    if (username.length < 3) {
      throw new GraphQLError('Username must be at least 3 characters long');
    }
    if (username.length > 50) {
        throw new GraphQLError('Username cannot exceed 50 characters');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      throw new GraphQLError('Username can only contain letters, numbers, underscores and hyphens');
    }
  }

  /**
   * Validates Project Name
   */
  static validateProjectName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new GraphQLError('Project Name is required');
    }
    if (name.length > 100) {
      throw new GraphQLError('Project Name cannot exceed 100 characters');
    }
  }

  /**
   * Validates Issue Title
   */
  static validateIssueTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new GraphQLError('Issue Title is required');
    }
    if (title.length > 200) {
      throw new GraphQLError('Issue Title cannot exceed 200 characters');
    }
  }

  /**
   * Validates Comment Content
   */
  static validateCommentContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new GraphQLError('Comment Content is required');
    }
    if (content.length > 5000) {
      throw new GraphQLError('Comment cannot exceed 5000 characters');
    }
  }

  /**
   * Sanitiert Text-Input
   */
  static sanitizeText(text: string): string {
    return text.trim().replace(/\s+/g, ' ');
  }

  /**
   * Validates ID Format
   */
  static validateId(id: string, fieldName: string = 'ID'): void {
    if (!id || id.trim().length === 0) {
      throw new GraphQLError(`${fieldName} is required`);
    }
    // Check CUID format (if used)
    if (!/^c[a-z0-9]{24}$/.test(id)) {
      throw new GraphQLError(`Invalid ${fieldName} format`);
    }
  }

  /**
    * Validates Enum Values
   */
  static validateEnum<T>(value: string, allowedValues: T[], fieldName: string): void {
    if (!allowedValues.includes(value as T)) {
      throw new GraphQLError(`Invalid value for ${fieldName}. Allowed values: ${allowedValues.join(', ')}`);
    }
  }
} 