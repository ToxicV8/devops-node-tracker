#!/bin/bash

# Setup Script for Docker Secrets (Local Development)
set -e

echo "Setting up Docker Secrets for Issue Tracker Backend..."

# Create secrets directory
mkdir -p secrets

# Generate secure passwords and secrets
echo "Generating secure credentials..."

# Database password
if [ ! -f secrets/db_password.txt ]; then
    # string in postgres wont work with special characters
    openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32 > secrets/db_password.txt
    echo "Database password generated"
else
    echo "Database password already exists"
fi

# JWT Secret
if [ ! -f secrets/jwt_secret.txt ]; then
    openssl rand -base64 64 > secrets/jwt_secret.txt
    echo "JWT secret generated"
else
    echo "JWT secret already exists"
fi

# Create .env file
if [ ! -f .env ]; then
    echo "Creating .env file..."
    
    DB_PASSWORD=$(cat secrets/db_password.txt)
    JWT_SECRET=$(cat secrets/jwt_secret.txt)
    
    cat > .env << EOF
# Backend Configuration
NODE_ENV=development
PORT=4000
HOST=0.0.0.0

# Database Configuration
POSTGRES_PASSWORD=${DB_PASSWORD}
DATABASE_URL="postgresql://issuetracker:${DB_PASSWORD}@localhost:5432/issuetracker_db"

# Authentication
JWT_SECRET=${JWT_SECRET}

# Password Hashing
BCRYPT_ROUNDS=12

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15
EOF
    echo ".env file created"
else
    echo ".env file already exists"
fi

# Set correct permissions
chmod 600 secrets/*.txt
chmod 600 .env

echo ""
echo "Setup completed!"
echo ""
echo "Next steps:"
echo "1. Start services: npm run docker:run"
echo "2. Run Prisma migrations: npm run prisma:migrate"
echo "3. Open GraphiQL: http://localhost:4000/graphiql"
echo "4. Database management: http://localhost:8080"
echo ""
echo "Important:"
echo "- Secrets are stored in ./secrets/"
echo "- .env file contains all environment variables"
echo "- Add secrets/ and .env to .gitignore!"
echo ""

# Check if .gitignore excludes secrets
if ! grep -q "secrets/" .gitignore 2>/dev/null; then
    echo "Warning: Add 'secrets/' to .gitignore!"
fi

if ! grep -q ".env" .gitignore 2>/dev/null; then
    echo "Warning: Add '.env' to .gitignore!"
fi 