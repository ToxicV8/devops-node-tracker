# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application with environment variables
ARG VITE_API_URL
ARG VITE_GRAPHQL_ENDPOINT
ARG VITE_APP_NAME
ARG VITE_APP_VERSION
ARG VITE_ENABLE_ANALYTICS
ARG VITE_ENABLE_DEBUG_MODE
ARG VITE_COMPANY_NAME
ARG VITE_COMPANY_ADDRESS
ARG VITE_COMPANY_PHONE
ARG VITE_COMPANY_EMAIL
ARG VITE_COMPANY_WEBSITE
ARG VITE_CEO_NAME
ARG VITE_REGISTER_COURT
ARG VITE_REGISTER_NUMBER
ARG VITE_VAT_ID
ARG VITE_FOUNDING_YEAR
ARG VITE_DPO_NAME
ARG VITE_DPO_EMAIL
ARG VITE_DPO_PHONE
ARG VITE_PRIVACY_POLICY_DATE
ARG VITE_GITHUB_URL

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
