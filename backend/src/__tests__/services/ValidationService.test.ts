import { ValidationService } from '../../services/ValidationService';

describe('ValidationService', () => {
  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        '123@numbers.com'
      ];

      validEmails.forEach(email => {
        expect(() => ValidationService.validateEmail(email)).not.toThrow();
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com',
        'user@example..com',
        'user@example',
        'user@.com',
        'user name@example.com',
        'user@example..com',
        'user@',
        'user@example',
        'user@.com',
        'user@example..com'
      ];

      invalidEmails.forEach(email => {
        try {
          ValidationService.validateEmail(email);
          // If we get here, the email was accepted but should have been rejected
          throw new Error(`Email "${email}" was accepted but should have been rejected`);
        } catch (error: any) {
          expect(error.message).toBe('Invalid Email Format');
        }
      });
    });
  });

  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      const validPasswords = [
        'Password123',
        'MySecurePass1',
        'ComplexP@ss1'
      ];

      validPasswords.forEach(password => {
        expect(() => ValidationService.validatePassword(password)).not.toThrow();
      });
    });

    it('should reject passwords that are too short', () => {
      expect(() => ValidationService.validatePassword('Pass1')).toThrow(
        'Password must be at least 8 characters long'
      );
    });

    it('should reject passwords without uppercase letters', () => {
      expect(() => ValidationService.validatePassword('password123')).toThrow(
        'Password must contain uppercase and lowercase letters and numbers'
      );
    });

    it('should reject passwords without lowercase letters', () => {
      expect(() => ValidationService.validatePassword('PASSWORD123')).toThrow(
        'Password must contain uppercase and lowercase letters and numbers'
      );
    });

    it('should reject passwords without numbers', () => {
      expect(() => ValidationService.validatePassword('PasswordABC')).toThrow(
        'Password must contain uppercase and lowercase letters and numbers'
      );
    });
  });

  describe('validateUsername', () => {
    it('should accept valid usernames', () => {
      const validUsernames = [
        'user123',
        'test_user',
        'my-username',
        'user_name_123'
      ];

      validUsernames.forEach(username => {
        expect(() => ValidationService.validateUsername(username)).not.toThrow();
      });
    });

    it('should reject usernames that are too short', () => {
      expect(() => ValidationService.validateUsername('ab')).toThrow(
        'Username must be at least 3 characters long'
      );
    });

    it('should reject usernames that are too long', () => {
      const longUsername = 'a'.repeat(51);
      expect(() => ValidationService.validateUsername(longUsername)).toThrow(
        'Username cannot exceed 50 characters'
      );
    });

    it('should reject usernames with invalid characters', () => {
      const invalidUsernames = [
        'user@name',
        'user.name',
        'user name',
        'user!name'
      ];

      invalidUsernames.forEach(username => {
        expect(() => ValidationService.validateUsername(username)).toThrow(
          'Username can only contain letters, numbers, underscores and hyphens'
        );
      });
    });
  });

  describe('validateProjectName', () => {
    it('should accept valid project names', () => {
      const validNames = [
        'My Project',
        'Project 123',
        'A',
        'A'.repeat(100)
      ];

      validNames.forEach(name => {
        expect(() => ValidationService.validateProjectName(name)).not.toThrow();
      });
    });

    it('should reject empty project names', () => {
      expect(() => ValidationService.validateProjectName('')).toThrow(
        'Project Name is required'
      );
      expect(() => ValidationService.validateProjectName('   ')).toThrow(
        'Project Name is required'
      );
    });

    it('should reject project names that are too long', () => {
      const longName = 'A'.repeat(101);
      expect(() => ValidationService.validateProjectName(longName)).toThrow(
        'Project Name cannot exceed 100 characters'
      );
    });
  });

  describe('validateIssueTitle', () => {
    it('should accept valid issue titles', () => {
      const validTitles = [
        'Bug in login',
        'Feature request',
        'A',
        'A'.repeat(200)
      ];

      validTitles.forEach(title => {
        expect(() => ValidationService.validateIssueTitle(title)).not.toThrow();
      });
    });

    it('should reject empty issue titles', () => {
      expect(() => ValidationService.validateIssueTitle('')).toThrow(
        'Issue Title is required'
      );
      expect(() => ValidationService.validateIssueTitle('   ')).toThrow(
        'Issue Title is required'
      );
    });

    it('should reject issue titles that are too long', () => {
      const longTitle = 'A'.repeat(201);
      expect(() => ValidationService.validateIssueTitle(longTitle)).toThrow(
        'Issue Title cannot exceed 200 characters'
      );
    });
  });

  describe('validateCommentContent', () => {
    it('should accept valid comment content', () => {
      const validContent = [
        'This is a comment',
        'A',
        'A'.repeat(5000)
      ];

      validContent.forEach(content => {
        expect(() => ValidationService.validateCommentContent(content)).not.toThrow();
      });
    });

    it('should reject empty comment content', () => {
      expect(() => ValidationService.validateCommentContent('')).toThrow(
        'Comment Content is required'
      );
      expect(() => ValidationService.validateCommentContent('   ')).toThrow(
        'Comment Content is required'
      );
    });

    it('should reject comment content that is too long', () => {
      const longContent = 'A'.repeat(5001);
      expect(() => ValidationService.validateCommentContent(longContent)).toThrow(
        'Comment cannot exceed 5000 characters'
      );
    });
  });

  describe('sanitizeText', () => {
    it('should trim whitespace', () => {
      expect(ValidationService.sanitizeText('  hello world  ')).toBe('hello world');
    });

    it('should normalize multiple spaces', () => {
      expect(ValidationService.sanitizeText('hello    world')).toBe('hello world');
      expect(ValidationService.sanitizeText('hello\t\tworld')).toBe('hello world');
      expect(ValidationService.sanitizeText('hello\n\nworld')).toBe('hello world');
    });

    it('should handle empty strings', () => {
      expect(ValidationService.sanitizeText('')).toBe('');
      expect(ValidationService.sanitizeText('   ')).toBe('');
    });
  });

  describe('validateId', () => {
    it('should accept valid CUID format', () => {
      const validIds = [
        'clh1234567890123456789012',
        'clhabcdefghijklmnopqrstuv'
      ];

      validIds.forEach(id => {
        expect(() => ValidationService.validateId(id, 'Test ID')).not.toThrow();
      });
    });

    it('should reject empty IDs', () => {
      expect(() => ValidationService.validateId('', 'Test ID')).toThrow(
        'Test ID is required'
      );
      expect(() => ValidationService.validateId('   ', 'Test ID')).toThrow(
        'Test ID is required'
      );
    });

    it('should reject invalid CUID format', () => {
      const invalidIds = [
        'invalid-id',
        '123456789012345678901234',
        'clh123456789012345678901', // too short
        'clh12345678901234567890123' // too long
      ];

      invalidIds.forEach(id => {
        expect(() => ValidationService.validateId(id, 'Test ID')).toThrow(
          'Invalid Test ID format'
        );
      });
    });
  });

  describe('validateEnum', () => {
    it('should accept valid enum values', () => {
      const allowedValues = ['TODO', 'IN_PROGRESS', 'DONE'];
      
      allowedValues.forEach(value => {
        expect(() => ValidationService.validateEnum(value, allowedValues, 'Status')).not.toThrow();
      });
    });

    it('should reject invalid enum values', () => {
      const allowedValues = ['TODO', 'IN_PROGRESS', 'DONE'];
      const invalidValues = ['PENDING', 'COMPLETED', 'INVALID'];
      
      invalidValues.forEach(value => {
        expect(() => ValidationService.validateEnum(value, allowedValues, 'Status')).toThrow(
          'Invalid value for Status. Allowed values: TODO, IN_PROGRESS, DONE'
        );
      });
    });
  });
}); 