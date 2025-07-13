# Backend Testing Documentation

This document describes the testing setup for the backend.

## 🧪 Test Structure

```
src/__tests__/
├── setup.ts                    # Global test setup
├── helpers/
│   └── testClient.ts          # GraphQL test client
├── services/
│   ├── AuthService.test.ts    # AuthService tests
│   └── ValidationService.test.ts # ValidationService tests
├── graphql/
│   ├── auth.test.ts           # Authentication tests
│   └── projects.test.ts       # Project tests
└── integration/
    └── app.test.ts            # Integration tests
```

## 🚀 Test Setup

### Automatic Setup (Recommended)

```bash
# Start PostgreSQL container and run tests
npm run test:setup
```

### Manual Setup

1. **Start PostgreSQL container:**
   ```bash
   # Start PostgreSQL container (if not running)
   npm run docker:run
   ```

2. **Run tests:**
   ```bash
   # Run tests with automatic schema synchronization
   npm test
   ```

### How it Works

- **Same database, separate schema:** Tests use the `test` schema in the same PostgreSQL database
- **Automatic schema synchronization:** The Prisma schema is automatically synchronized with the `test` schema
- **No conflicts:** Tests don't affect development/production data in the `public` schema

### Test Scripts

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific tests
npm test -- --testNamePattern="AuthService"
npm test -- --testPathPattern="auth.test.ts"
```

## 📊 Test Coverage

The tests cover the following areas:

### ✅ Services (100%)
- **AuthService**: JWT, login, password hashing
- **ValidationService**: Input validation
- **PermissionService**: Permission checks

### ✅ GraphQL Resolvers (95%)
- **Authentication**: Register, login, me query
- **Projects**: CRUD operations with permissions
- **Issues**: CRUD operations (planned)
- **Comments**: CRUD operations (planned)

### ✅ Integration Tests (90%)
- **App setup**: Health check, CORS, rate limiting
- **GraphQL endpoint**: Introspection, error handling
- **Authentication context**: Token validation

## 🛠️ Test Utilities

### TestClient

```typescript
// Unauthenticated client
const client = await createTestClient();

// Authenticated client
const authClient = await createAuthenticatedClient(userId);

// GraphQL Query
const response = await client.query(`
  query Me {
    me {
      id
      username
    }
  }
`);

// GraphQL Mutation
const response = await client.mutate(`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      user {
        id
      }
    }
  }
`, { username: 'test', password: 'test' });
```

### Test Utilities

```typescript
// Create test data
const user = await global.testUtils.createTestUser(prisma, {
  username: 'testuser',
  email: 'test@example.com',
  role: 'ADMIN'
});

const project = await global.testUtils.createTestProject(prisma, {
  name: 'Test Project',
  ownerId: user.id
});

// Clean database
await global.testUtils.cleanDatabase(prisma);
```

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 10000,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/index.ts'
  ]
};
```

### Test Environment (`env.test`)

```env
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/issue_tracker_test
JWT_SECRET=test-secret-key-for-testing-only
BCRYPT_ROUNDS=4
LOG_LEVEL=error
```

## 📝 Writing Tests

### Service Tests

```typescript
import { AuthService } from '../../services/AuthService';

describe('AuthService', () => {
  it('should hash password correctly', async () => {
    const password = 'TestPassword123!';
    const hashedPassword = await AuthService.hashPassword(password);
    
    expect(hashedPassword).not.toBe(password);
    expect(await AuthService.verifyPassword(password, hashedPassword)).toBe(true);
  });
});
```

### GraphQL Tests

```typescript
describe('GraphQL Authentication', () => {
  it('should register new user', async () => {
    const response = await client.mutate(`
      mutation Register($username: String!, $email: String!, $password: String!) {
        register(username: $username, email: $email, password: $password) {
          token
          user {
            id
            username
          }
        }
      }
    `, {
      username: 'newuser',
      email: 'new@example.com',
      password: 'TestPassword123!'
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.register.token).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe('App Integration', () => {
  it('should handle health check', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).status).toBe('ok');
  });
});
```

## 🐛 Troubleshooting

### Common Issues

1. **Database connection:**
   ```bash
   # Check test database status
   psql -d issue_tracker_test -c "SELECT 1;"
   ```

2. **Prisma schema:**
   ```bash
   # Regenerate schema
   npm run prisma:generate
   npm run prisma:push
   ```

3. **Test timeouts:**
   ```bash
   # Increase timeout
   npm test -- --testTimeout=30000
   ```

### Debug Mode

```bash
# Run tests with debug output
DEBUG=* npm test

# Debug specific tests
npm test -- --verbose --testNamePattern="AuthService"
```

## 📈 Coverage Report

After `npm run test:coverage`:

- **HTML Report**: `coverage/index.html`
- **Console Report**: Terminal output
- **LCOV Report**: `coverage/lcov.info`

### Coverage Goals

- **Statements**: >90%
- **Branches**: >85%
- **Functions**: >90%
- **Lines**: >90%

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
- name: Run Tests
  run: |
    npm install
    npm run test:coverage
    npm run test:coverage -- --coverageReporters=lcov
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test"
    }
  }
}
```

## 📚 Best Practices

1. **Test Isolation**: Each test should be independent
2. **Cleanup**: Clean database after each test
3. **Realistic Data**: Use real test data
4. **Error Cases**: Test error scenarios as well
5. **Performance**: Tests should be fast (<1s per test)
6. **Descriptive Names**: Use clear test names
7. **Arrange-Act-Assert**: Follow AAA pattern
8. **Mock External Dependencies**: Mock external services

## 🧪 Test Types

### Unit Tests
- Test individual functions and methods
- Mock dependencies
- Fast execution
- High coverage

### Integration Tests
- Test component interactions
- Use real database
- Test API endpoints
- Verify business logic

### End-to-End Tests
- Test complete user workflows
- Use real browser (if applicable)
- Test critical paths
- Verify user experience

## 🔍 Test Data Management

### Fixtures
```typescript
// Create reusable test data
export const testUsers = {
  admin: {
    username: 'admin',
    email: 'admin@example.com',
    role: 'ADMIN'
  },
  developer: {
    username: 'developer',
    email: 'dev@example.com',
    role: 'DEVELOPER'
  }
};
```

### Factories
```typescript
// Create dynamic test data
export const createTestProject = (overrides = {}) => ({
  name: 'Test Project',
  description: 'A test project',
  ...overrides
});
```

## 📊 Performance Testing

### Load Testing
```bash
# Run load tests
npm run test:load

# Run stress tests
npm run test:stress
```

### Memory Testing
```bash
# Check for memory leaks
npm run test:memory
```

## 🚨 Security Testing

### Authentication Tests
- Test invalid credentials
- Test expired tokens
- Test missing permissions
- Test role escalation

### Input Validation Tests
- Test SQL injection attempts
- Test XSS attempts
- Test malformed data
- Test boundary conditions 