# DevOps Node Tracker - Frontend

A modern React frontend for the DevOps Node Tracker with GraphQL integration.

## 🚀 Features

- **Modern React 18** with TypeScript
- **GraphQL Integration** with Apollo Client
- **Responsive Design** with Tailwind CSS
- **Authentication** with JWT
- **State Management** with Zustand
- **Routing** with React Router
- **Forms** with React Hook Form
- **Notifications** with React Hot Toast
- **Icons** with Lucide React
- **Internationalization** with i18next
- **Theme Support** with dark/light mode

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- Backend server running on port 4000

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components
│   ├── ui/             # Base UI components
│   └── theme/          # Theme components
├── pages/              # Page components
├── hooks/              # Custom hooks
├── services/           # API services
├── store/              # State management
├── types/              # TypeScript types
├── utils/              # Utility functions
├── lib/                # Configuration files
└── styles/             # Global styles
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run type-check` - Check TypeScript types

## 🌐 GraphQL Integration

The frontend is fully integrated with the backend's GraphQL API:

- **Apollo Client** for GraphQL operations
- **Automatic token management** for authentication
- **Error handling** with toast notifications
- **Optimistic updates** for better UX
- **Type-safe queries** with GraphQL code generation

## 🎨 Design System

- **Tailwind CSS** for styling
- **Responsive design** for all screen sizes
- **Dark/Light theme** support
- **Consistent components** with reusable styles
- **Modern UI/UX** with smooth animations

## 🔐 Authentication

- **JWT-based authentication**
- **Protected routes** with ProtectedRoute component
- **Automatic token storage** in localStorage
- **Logout functionality**
- **Role-based access control**

## 📱 Responsive Design

The frontend is fully responsive and works on:
- Desktop (>= 1024px)
- Tablet (768px - 1023px)
- Mobile (< 768px)

## 🌍 Internationalization

The application supports multiple languages:
- **German** (default)
- **English**
- **Language switcher** in the header
- **Dynamic content loading**

## 🚀 Deployment

1. **Create build:**
   ```bash
   npm run build
   ```

2. **Deploy dist folder** to your web server

### Docker Deployment

```bash
# Build Docker image
docker build -t devops-tracker-frontend .

# Run container
docker run -p 3000:80 devops-tracker-frontend
```

## 🔧 Configuration

Key configuration files:

- `vite.config.ts` - Vite configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `src/lib/apollo.ts` - Apollo Client configuration
- `src/i18n.ts` - Internationalization setup

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📦 Environment Variables

Create a `.env` file in the frontend directory:

```env
# API Configuration
VITE_API_URL=http://localhost:4000/graphql
VITE_WS_URL=ws://localhost:4000/graphql

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true

# Build Configuration
VITE_APP_VERSION=1.0.0
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style Guidelines

- Use TypeScript for all new code
- Follow ESLint configuration
- Use functional components with hooks
- Write tests for new features
- Update documentation as needed
- Follow the established component structure

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

**Build errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**GraphQL connection issues:**
- Check if backend is running on port 4000
- Verify VITE_API_URL in .env file
- Check network connectivity

**Styling issues:**
- Ensure Tailwind CSS is properly configured
- Check if PostCSS is working correctly
- Verify CSS imports in main.tsx

## 🗺 Roadmap

- [ ] Real-time notifications
- [ ] Advanced search and filtering
- [ ] File upload functionality
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Custom themes
- [ ] Keyboard shortcuts
- [ ] Offline support 