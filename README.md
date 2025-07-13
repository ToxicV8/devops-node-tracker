# DevOps Issue Tracker

A modern, full-stack issue tracking system built with Node.js, React, and GraphQL, designed for and project management and ticket system.

## 🚀 Features

- **Modern Tech Stack**: TypeScript, React 18, GraphQL, Prisma
- **Role-Based Access Control**: Multi-tier permission system
- **Multi-Project Support**: Manage multiple projects with granular permissions
- **Real-time Updates**: GraphQL subscriptions for live updates
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Docker Ready**: Complete containerization with production setup
- **Comprehensive Testing**: Unit, integration, and end-to-end tests
- **Internationalization**: Multi-language support (i18n)

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **API**: GraphQL with Mercurius (Fastify)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Containerization**: Docker & Docker Compose
- **Testing**: Jest with supertest

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **GraphQL Client**: Apollo Client
- **Routing**: React Router
- **Forms**: React Hook Form
- **Build Tool**: Vite

## 📁 Project Structure

```
devops-node-tracker/
├── backend/                 # Node.js GraphQL API
│   ├── src/
│   │   ├── graphql/        # GraphQL schema & resolvers
│   │   ├── services/       # Business logic services
│   │   └── __tests__/      # Test files
│   ├── prisma/             # Database schema & migrations
│   └── docker-compose.yml  # Development environment
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   └── store/         # State management
│   └── Dockerfile         # Frontend container
├── k8s/                   # Kubernetes manifests
├── terraform/             # Infrastructure as Code
└── docker-compose.yml     # Root compose file
```

## 🚦 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### 1. Clone Repository

```bash
git clone <repository-url>
cd devops-node-tracker
```

### 2. Backend Setup

```bash
cd backend
npm install
npm run setup
npm run docker:run
npm run prisma:migrate
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

### 4. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/graphql
- **GraphiQL**: http://localhost:4000/graphiql
- **Database Admin**: http://localhost:8080

## 🔧 Development

### Backend Development

```bash
cd backend
npm run dev          # Start development server
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
```

### Frontend Development

```bash
cd frontend
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
```

### Database Management

```bash
cd backend
npm run prisma:studio  # Open Prisma Studio
npm run prisma:migrate # Run migrations
npm run prisma:reset   # Reset database
```

## 🐳 Docker Deployment

### Development

```bash
# Start all services
docker-compose up

# Start specific services
docker-compose up backend frontend
```

### Production

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test                    # Run all tests
npm run test:coverage      # Run with coverage
npm run test:watch         # Watch mode
```

### Frontend Tests

```bash
cd frontend
npm test                   # Run tests
npm run test:coverage      # Run with coverage
```

## 📚 Documentation

- [Backend README](backend/README.md) - Detailed backend documentation
- [Backend Setup Guide](backend/README-Setup.md) - Complete setup instructions
- [Backend Tests](backend/README-Tests.md) - Testing documentation
- [Frontend README](frontend/README.md) - Frontend documentation

## 🔒 Security Features

- **Password Hashing**: bcrypt with configurable rounds
- **Input Validation**: Comprehensive validation for all inputs
- **XSS Protection**: HTML sanitization for user content
- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **SQL Injection Prevention**: Prisma ORM with parameterized queries

## 🌐 API Documentation

The application uses GraphQL with a comprehensive schema including:

- **User Management**: Registration, authentication, profile management
- **Project Management**: Create, update, and manage projects
- **Issue Tracking**: Create, assign, and track issues with priorities
- **Comment System**: Collaborative discussions on issues
- **Role Management**: Granular permissions for users and projects

### Example GraphQL Query

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

## 🆘 Support

For support and questions:

1. Check existing issues in the repository
2. Create a new issue with detailed description
3. Include environment details and error logs

## 🗺 Roadmap

- [ ] Real-time notifications
- [ ] Email integration
- [ ] Advanced search and filtering
- [ ] API rate limiting
- [ ] Audit logging
- [ ] File attachments
- [ ] Custom fields
- [ ] Webhooks integration
- [ ] Mobile app
- [ ] Advanced analytics dashboard
