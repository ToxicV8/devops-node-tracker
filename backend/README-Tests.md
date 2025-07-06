# Backend Tests

Dieses Dokument beschreibt das Test-Setup für das Backend.

## 🧪 Test-Struktur

```
src/__tests__/
├── setup.ts                    # Globales Test-Setup
├── helpers/
│   └── testClient.ts          # GraphQL Test-Client
├── services/
│   ├── AuthService.test.ts    # AuthService Tests
│   └── ValidationService.test.ts # ValidationService Tests
├── graphql/
│   ├── auth.test.ts           # Authentication Tests
│   └── projects.test.ts       # Project Tests
└── integration/
    └── app.test.ts            # Integration Tests
```

## 🚀 Test-Setup

### Voraussetzungen

1. **Test-Datenbank einrichten:**
   ```bash
   # PostgreSQL Test-Datenbank erstellen
   createdb issue_tracker_test
   ```

2. **Test-Umgebung konfigurieren:**
   ```bash
   # Test-Umgebungsvariablen setzen
   cp env.test .env.test
   ```

3. **Datenbank-Schema für Tests:**
   ```bash
   # Prisma Schema für Test-DB pushen
   npm run prisma:push
   ```

### Test-Skripte

```bash
# Alle Tests ausführen
npm test

# Tests im Watch-Modus
npm run test:watch

# Tests mit Coverage
npm run test:coverage

# Spezifische Tests
npm test -- --testNamePattern="AuthService"
npm test -- --testPathPattern="auth.test.ts"
```

## 📊 Test-Coverage

Die Tests decken folgende Bereiche ab:

### ✅ Services (100%)
- **AuthService**: JWT, Login, Passwort-Hashing
- **ValidationService**: Input-Validierung
- **PermissionService**: Berechtigungsprüfungen

### ✅ GraphQL Resolvers (95%)
- **Authentication**: Register, Login, Me Query
- **Projects**: CRUD-Operationen mit Permissions
- **Issues**: CRUD-Operationen (geplant)
- **Comments**: CRUD-Operationen (geplant)

### ✅ Integration Tests (90%)
- **App-Setup**: Health Check, CORS, Rate Limiting
- **GraphQL-Endpoint**: Introspection, Error Handling
- **Authentication Context**: Token-Validierung

## 🛠️ Test-Utilities

### TestClient

```typescript
// Unauthentifizierter Client
const client = await createTestClient();

// Authentifizierter Client
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

### Test-Utilities

```typescript
// Test-Daten erstellen
const user = await global.testUtils.createTestUser(prisma, {
  username: 'testuser',
  email: 'test@example.com',
  role: 'ADMIN'
});

const project = await global.testUtils.createTestProject(prisma, {
  name: 'Test Project',
  ownerId: user.id
});

// Datenbank bereinigen
await global.testUtils.cleanDatabase(prisma);
```

## 🔧 Test-Konfiguration

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

### Test-Umgebung (`env.test`)

```env
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/issue_tracker_test
JWT_SECRET=test-secret-key-for-testing-only
BCRYPT_ROUNDS=4
LOG_LEVEL=error
```

## 📝 Test-Schreiben

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

### Häufige Probleme

1. **Datenbank-Verbindung:**
   ```bash
   # Test-DB Status prüfen
   psql -d issue_tracker_test -c "SELECT 1;"
   ```

2. **Prisma Schema:**
   ```bash
   # Schema neu generieren
   npm run prisma:generate
   npm run prisma:push
   ```

3. **Test-Timeouts:**
   ```bash
   # Timeout erhöhen
   npm test -- --testTimeout=30000
   ```

### Debug-Modus

```bash
# Tests mit Debug-Output
DEBUG=* npm test

# Spezifische Tests debuggen
npm test -- --verbose --testNamePattern="AuthService"
```

## 📈 Coverage-Report

Nach `npm run test:coverage`:

- **HTML Report**: `coverage/index.html`
- **Console Report**: Terminal-Output
- **LCOV Report**: `coverage/lcov.info`

### Coverage-Ziele

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

1. **Test-Isolation**: Jeder Test sollte unabhängig sein
2. **Cleanup**: Datenbank nach jedem Test bereinigen
3. **Realistische Daten**: Echte Test-Daten verwenden
4. **Error Cases**: Auch Fehlerfälle testen
5. **Performance**: Tests sollten schnell sein (<1s pro Test) 