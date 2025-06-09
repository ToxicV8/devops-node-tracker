# 🚀 Issue Tracker Backend - Setup Guide

Complete setup guide for the Issue Tracker Backend across different operating systems.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ 
- **npm** 8+
- **Docker** & **Docker Compose**
- **Git**

## 🚦 Quick Start

### 🐧 Linux / macOS

```bash
# 1. Clone repository
git clone <repository-url>
cd backend

# 2. Install dependencies
npm install

# 3. Generate secrets and .env
npm run setup

# 4. Start Docker services
npm run docker:run

# 5. Run database migrations
npm run prisma:migrate
```

### 🪟 Windows (PowerShell) - Recommended

```powershell
# 1. Clone repository
git clone <repository-url>
cd backend

# 2. Install dependencies
npm install

# 3. Generate secrets and .env
npm run setup:powershell

# Optional: With force parameter to overwrite existing files
powershell -ExecutionPolicy Bypass -File setup-secrets.ps1 -Force

# 4. Start Docker services
npm run docker:run

# 5. Run database migrations
npm run prisma:migrate
```

### 🪟 Windows (Command Prompt)

```cmd
# 1. Clone repository
git clone <repository-url>
cd backend

# 2. Install dependencies
npm install

# 3. Generate secrets and .env
powershell -ExecutionPolicy Bypass -File setup-secrets.ps1

# 4. Start Docker services
npm run docker:run

# 5. Run database migrations
npm run prisma:migrate
```

## 📁 Generated Files

The setup process creates the following files:

```
backend/
├── .env                    # Environment variables
├── secrets/
│   ├── db_password.txt     # Database password
│   └── jwt_secret.txt      # JWT secret key
└── ...
```

**⚠️ IMPORTANT:** Add these to your `.gitignore`:

```gitignore
# Environment files
.env
.env.*

# Secret files
secrets/
```

## 🌐 Available Services

After successful setup, the following services are available:

| Service | URL | Description |
|---------|-----|-------------|
| **Backend API** | http://localhost:4000 | GraphQL API endpoint |
| **GraphiQL** | http://localhost:4000/graphiql | GraphQL Playground |
| **Health Check** | http://localhost:4000/health | Server status endpoint |
| **PostgreSQL** | localhost:5432 | Database server |
| **Adminer** | http://localhost:8080 | Database management UI |
| **Redis** | localhost:6379 | Cache server (optional) |

## 🛠️ Available NPM Scripts

### Development
```bash
npm run dev                 # Start development server (Hot reload)
npm run start:dev          # Start directly with tsx
npm run build              # Compile TypeScript
npm run start              # Start production server
```

### Database & Prisma
```bash
npm run prisma:generate    # Generate Prisma client
npm run prisma:push        # Push schema to database
npm run prisma:migrate     # Create and run migrations
npm run prisma:studio      # Open Prisma Studio
npm run prisma:reset       # Reset database
```

### Docker
```bash
npm run docker:build       # Build Docker image
npm run docker:run         # Start all services
npm run docker:stop        # Stop all services
npm run docker:logs        # View backend logs
npm run docker:prod        # Start production deployment
```

### Setup
```bash
npm run setup              # Linux/macOS setup
npm run setup:powershell   # Windows PowerShell setup
npm run setup:windows      # Windows Command Prompt setup
```

### Testing & Quality
```bash
npm run test               # Run tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Generate test coverage
npm run lint               # Run ESLint
npm run lint:fix           # Run ESLint with auto-fix
npm run type-check         # TypeScript type checking
```

## ⚙️ Configuration

### Environment Variables

Key variables in `.env`:

```bash
# Server Configuration
NODE_ENV=development
PORT=4000
HOST=0.0.0.0

# Database Configuration
DATABASE_URL="postgresql://issuetracker:PASSWORD@localhost:5432/issuetracker_db"

# Security
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# Features
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15
```

### Docker Compose Override

For local customizations, create `docker-compose.override.yml`:

```yaml
version: '3.8'
services:
  backend:
    environment:
      - LOG_LEVEL=debug
    volumes:
      - ./src:/app/src  # Enable hot reload for development
    ports:
      - "4001:4000"     # Use different port if needed
```

## 🚨 Troubleshooting

### Port Already in Use

```bash
# Check which process is using port 4000
netstat -tulpn | grep 4000  # Linux/macOS
netstat -ano | findstr 4000 # Windows

# Change port in .env file
PORT=4001
```

### PowerShell Execution Policy (Windows)

```powershell
# Temporarily allow script execution
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# Or run directly with bypass
powershell -ExecutionPolicy Bypass -File setup-secrets.ps1
```

### Docker Permission Errors (Linux)

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again for changes to take effect
```

### Database Connection Issues

```bash
# Check PostgreSQL container logs
docker-compose logs postgres

# Verify connection string in .env
# Ensure containers are running
docker-compose ps

# Restart services if needed
docker-compose restart
```

### Prisma Migration Errors

```bash
# Reset database and migrations
npm run prisma:reset

# Generate new migration
npm run prisma:migrate

# Or push schema directly
npm run prisma:push
```

### Build Errors

```bash
# Clean node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear TypeScript cache
rm -rf dist/
npm run build
```

## 🔧 Development Workflow

### 1. Initial Setup
```bash
# Clone and setup
git clone <repository-url>
cd backend
npm install
npm run setup
```

### 2. Daily Development
```bash
# Start services
npm run docker:run

# Start development server
npm run dev

# In another terminal, run migrations if needed
npm run prisma:migrate
```

### 3. Working with Database
```bash
# View data with Prisma Studio
npm run prisma:studio

# Or use Adminer in browser
# http://localhost:8080
```

### 4. Testing
```bash
# Run tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode during development
npm run test:watch
```

## 🏗️ Production Deployment

### Using Docker Compose

```bash
# Build and start production services
npm run docker:prod

# Or manually
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Production Setup

```bash
# Build application
npm run build

# Set production environment
export NODE_ENV=production

# Run migrations
npm run prisma:migrate

# Start server
npm start
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [GraphQL Documentation](https://graphql.org/learn/)
- [Fastify Documentation](https://www.fastify.io/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🆘 Getting Help

If you encounter issues:

1. **Check the logs**: `npm run docker:logs`
2. **Restart services**: `npm run docker:stop && npm run docker:run`
3. **Clean setup**: Delete `.env`, `secrets/` and run setup again
4. **Check Docker status**: `docker-compose ps`
5. **Verify environment**: Ensure all prerequisites are installed

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Port 4000 in use | Change PORT in .env or stop conflicting service |
| Docker permission denied | Add user to docker group (Linux) |
| Prisma client outdated | Run `npm run prisma:generate` |
| Database connection failed | Check DATABASE_URL and ensure PostgreSQL is running |
| PowerShell script blocked | Use `-ExecutionPolicy Bypass` parameter |

## 🤝 Contributing

When contributing to the setup process:

1. Test setup scripts on multiple platforms
2. Update this documentation for any new steps
3. Ensure backward compatibility
4. Document any new environment variables

---

**Need more help?** Check the main [README.md](README.md) for additional information about the project architecture and API documentation. 