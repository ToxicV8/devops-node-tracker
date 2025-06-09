# Issue Tracker Backend

A modern, scalable issue tracking system backend built with TypeScript, GraphQL, and Prisma.

## 🚀 Features

- **GraphQL API** - Modern, flexible API with type safety
- **Role-Based Access Control** - Multi-tier permission system with global and project-specific roles
- **Multi-Project Support** - Manage multiple projects with granular permissions
- **Issue Management** - Create, update, assign, and track issues with priorities and types
- **Comment System** - Collaborative discussions on issues
- **User Management** - User registration, authentication, and profile management
- **Security** - Password hashing, input validation, and XSS protection
- **Docker Ready** - Complete containerization with production-ready setup
- **Database Migrations** - Version-controlled database schema with Prisma

## 🛠 Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **API**: GraphQL with Mercurius (Fastify)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Validation**: Custom validation service
- **Containerization**: Docker & Docker Compose
- **Cache**: Redis (optional)

## 📁 Project Structure

```
backend/
├── src/
│   ├── graphql/
│   │   ├── schema.graphql       # GraphQL schema definition
│   │   └── resolvers.ts         # GraphQL resolvers
│   ├── services/
│   │   ├── PermissionService.ts # Role-based access control
│   │   └── ValidationService.ts # Input validation & sanitization
│   └── index.ts                 # Application entry point
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Database migrations
├── docker-compose.yml          # Development environment
├── docker-compose.prod.yml     # Production environment
├── Dockerfile                  # Container build instructions
└── setup-secrets.sh/ps1       # Environment setup scripts
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18 or higher
- Docker and Docker Compose
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd devops-node-tracker/backend
   ```

2. **Set up environment variables**
   
   **Linux/macOS:**
   ```bash
   chmod +x setup-secrets.sh
   ./setup-secrets.sh
   ```
   
   **Windows (PowerShell):**
   ```powershell
   .\setup-secrets.ps1
   ```
   
   **Windows (Command Prompt):**
   ```cmd
   powershell -ExecutionPolicy Bypass -File setup-secrets.ps1
   ```

3. **Start the services**
   ```bash
   npm run docker:run
   ```

4. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

5. **Access the application**
   - GraphiQL Playground: http://localhost:4000/graphiql
   - Database Admin: http://localhost:8080
   - API Endpoint: http://localhost:4000/graphql

## 🔧 Development Setup

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development database**
   ```bash
   docker-compose up postgres redis -d
   ```

3. **Run migrations**
   ```bash
   npm run prisma:migrate
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Backend Configuration
NODE_ENV=development
PORT=4000
HOST=0.0.0.0

# Database Configuration
DATABASE_URL="postgresql://issuetracker:password@localhost:5432/issuetracker_db"

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Password Hashing
BCRYPT_ROUNDS=12

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 📊 Database Schema

### User Roles

- **USER** - Basic user with limited permissions
- **DEVELOPER** - Can be assigned to issues and projects
- **MANAGER** - Can manage projects and assign issues
- **ADMIN** - Full system access

### Project Roles

- **MEMBER** - Can view project issues and comment
- **DEVELOPER** - Can be assigned issues
- **MAINTAINER** - Can assign issues and manage project
- **OWNER** - Full project control

## 🔌 API Documentation

### GraphQL Schema

The API follows GraphQL best practices with a type-safe schema. Key types include:

- **User** - User accounts and authentication
- **Project** - Project management and organization
- **Issue** - Issue tracking with status, priority, and assignment
- **Comment** - Discussion threads on issues
- **ProjectMember** - Project membership with roles

### Example Queries

**Get all projects:**
```graphql
query GetProjects {
  projects {
    id
    name
    description
    members {
      user {
        username
      }
      projectRole
    }
    issues {
      id
      title
      status
      priority
    }
  }
}
```

**Create an issue:**
```graphql
mutation CreateIssue {
  createIssue(
    title: "Bug in login system"
    description: "Users cannot log in with special characters"
    projectId: "project-id"
    priority: HIGH
    type: BUG
  ) {
    id
    title
    status
    reporter {
      username
    }
  }
}
```

## 🐳 Docker Deployment

### Development

```bash
docker-compose up
```

### Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment-specific configurations

- **Development**: Full logging, GraphiQL enabled, development database
- **Production**: Optimized for performance, security headers, production database

## 🔒 Security Features

- **Password Hashing** - bcrypt with configurable rounds
- **Input Validation** - Comprehensive validation for all inputs
- **XSS Protection** - HTML sanitization for user content
- **Authentication** - JWT-based authentication
- **Authorization** - Role-based access control
- **SQL Injection Prevention** - Prisma ORM with parameterized queries

## 📈 Performance

- **Database Indexing** - Optimized indexes for common queries
- **Connection Pooling** - Efficient database connection management
- **Caching** - Redis integration for session and query caching
- **Pagination** - Built-in pagination for large datasets

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run docker:run` - Start with Docker Compose
- `npm run docker:prod` - Start production environment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Write tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**Database connection failed:**
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env file
- Verify database credentials

**GraphiQL not loading:**
- Check if NODE_ENV is set to development
- Verify PORT configuration
- Ensure server is running on correct host

**Permission denied errors:**
- Check file permissions on secrets directory
- Ensure .env file has correct permissions (600)
- Verify Docker has access to project directory

### Support

For support and questions:
- Check existing issues in the repository
- Create a new issue with detailed description
- Include environment details and error logs

## 🗺 Roadmap

- [ ] Real-time notifications
- [ ] Email integration
- [ ] Advanced search and filtering
- [ ] API rate limiting
- [ ] Audit logging
- [ ] File attachments
- [ ] Custom fields
- [ ] Webhooks integration 