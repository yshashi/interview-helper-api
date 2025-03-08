# Interview Helper API

A production-ready Node.js API built with TypeScript, MongoDB, Prisma ORM, and authentication support for interview assistance.

## Features

- TypeScript with ES Modules
- Functional programming approach
- Express.js for API routes
- MongoDB database with Prisma ORM
- Authentication with JWT (local, Google, and GitHub strategies)
- User management and role-based authorization
- Swagger API documentation
- Winston logging
- Error handling middleware
- Rate limiting
- Docker support
- Environment configuration
- Health check endpoint

## Prerequisites

- Node.js 20.x or later
- npm 9.x or later
- MongoDB 4.4 or later

## Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd interview-helper-api
npm install
```

## Configuration

The application uses environment variables for configuration. Copy the example environment file to create your own:

```bash
cp .env.example .env
```

Edit the `.env` file to customize your configuration. Make sure to set the following variables:

- `DATABASE_URL`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `JWT_REFRESH_SECRET`: Secret key for JWT refresh token generation
- For social login, set the OAuth provider credentials:
  - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for Google authentication
  - `GIT_CLIENT_ID` and `GIT_CLIENT_SECRET` for GitHub authentication

## Available Scripts

- `npm run build` - Build the TypeScript code
- `npm run dev` - Run the application in development mode with hot reloading
- `npm start` - Run the application in production mode
- `npm test` - Run the test suite
- `npm run lint` - Lint the codebase
- `npm run format` - Format the codebase
- `npm run docker:build` - Build the Docker image
- `npm run docker:run` - Run the application in a Docker container

## Development

To start the application in development mode:

```bash
npm run dev
```

The server will be available at http://localhost:5500.

## API Documentation

Swagger documentation is available at http://localhost:5500/api-docs when the server is running.

## Production

To build and run the application in production mode:

```bash
npm run build
npm start
```

## Docker

The application is fully containerized and can be run using Docker. We provide two options for running with Docker:

### Option 1: Using npm scripts

To build and run the application using Docker with npm scripts:

```bash
npm run docker:build
npm run docker:run
```

### Option 2: Using Docker Compose (Recommended)

We provide a Docker Compose configuration that sets up both the API and MongoDB in a single command:

```bash
docker-compose up -d
```

This will:
- Build the API container using the optimized Dockerfile
- Start a MongoDB container
- Configure the network between them
- Set up persistent volumes for data and logs
- Configure health checks for both services

To stop the services:

```bash
docker-compose down
```

To rebuild and restart the services:

```bash
docker-compose up -d --build
```

To view logs:

```bash
docker-compose logs -f api
```

## Project Structure

```
interview-helper-api/
├── src/                  # Source code
│   ├── config/           # Configuration files
│   │   ├── database.ts   # Database connection with Prisma
│   │   ├── env.ts        # Environment variables configuration
│   │   ├── passport.ts   # Passport authentication strategies
│   │   └── swagger.ts    # Swagger API documentation
│   ├── middleware/       # Express middleware
│   │   ├── auth.middleware.ts # Authentication middleware
│   │   ├── errorHandler.js    # Error handling middleware
│   │   └── rateLimiter.js     # Rate limiting middleware
│   ├── routes/           # API routes
│   │   ├── auth.routes.ts     # Authentication routes
│   │   ├── health.js          # Health check routes
│   │   └── user.routes.ts     # User management routes
│   ├── services/         # Business logic
│   │   ├── auth.service.ts    # Authentication service
│   │   └── user.service.ts    # User management service
│   ├── utils/            # Utility functions
│   └── index.ts          # Application entry point
├── prisma/               # Prisma ORM
│   └── schema.prisma     # Database schema
├── dist/                 # Compiled JavaScript
├── logs/                 # Application logs
├── tests/                # Test files
├── .env                  # Environment variables (not in git)
├── .env.example          # Example environment variables
├── .eslintrc.json        # ESLint configuration
├── .prettierrc           # Prettier configuration
├── tsconfig.json         # TypeScript configuration
├── jest.config.js        # Jest configuration
├── Dockerfile            # Docker configuration
└── package.json          # Project metadata and dependencies
```

## Database Setup

The application uses MongoDB with Prisma ORM. The database schema is defined in `prisma/schema.prisma`. To set up the database:

1. Make sure MongoDB is running and accessible via the connection string in your `.env` file.

2. Generate the Prisma client:

```bash
npx prisma generate
```

3. If you want to create the collections in MongoDB (optional, as MongoDB will create them on first use):

```bash
npx prisma db push
```

## Authentication

The API supports the following authentication methods:

- **Local Authentication**: Username/email and password
- **Google OAuth**: Sign in with Google
- **GitHub OAuth**: Sign in with GitHub

Authentication endpoints are available at `/api/auth`:

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with email and password
- `GET /api/auth/google` - Initiate Google OAuth flow
- `GET /api/auth/github` - Initiate GitHub OAuth flow
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

Protected routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## User Management

User management endpoints are available at `/api/users`:

- `GET /api/users` - List users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user
- `PATCH /api/users/:id/role` - Update user role (admin only)
- `PATCH /api/users/:id/status` - Update user status (admin only)
- `DELETE /api/users/:id` - Delete user

## CI/CD Pipeline

This project includes a GitHub Actions workflow for continuous integration and deployment to a VPS.

### Workflow Overview

The workflow is defined in `.github/workflows/deploy.yml` and consists of two jobs:

1. **Build Job**:
   - Checks out the code
   - Sets up Docker Buildx
   - Logs in to Docker Hub using secrets
   - Builds and pushes a multi-platform Docker image to Docker Hub

2. **Deploy Job**:
   - Runs after the build job completes
   - Sets up SSH access to the VPS
   - Connects to the VPS and executes deployment commands:
     - Pulls the latest Docker image
     - Creates a Docker network if it doesn't exist
     - Stops and removes any existing API container
     - Starts a new API container with the appropriate environment variables

### Required Secrets

The following secrets need to be configured in your GitHub repository:

- `DOCKERHUB_USERNAME`: Your Docker Hub username
- `DOCKERHUB_PASSWORD`: Your Docker Hub password or access token
- `SSH_PRIVATE_KEY`: Private SSH key for accessing your VPS
- `SSH_USER`: Username for SSH access to your VPS
- `SSH_HOST`: Hostname or IP address of your VPS
- `API_URL`: Public URL for the API (e.g., https://api.interviewhelper.in)
- `CLIENT_URL`: URL for the client application
- `JWT_SECRET`: Secret for JWT token generation
- `JWT_EXPIRES_IN`: JWT token expiration time
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GIT_CLIENT_ID`: GitHub OAuth client ID
- `GIT_CLIENT_SECRET`: GitHub OAuth client secret

### Manual Deployment

If you need to deploy manually, you can use Docker Compose:

```bash
docker-compose up -d --build
```

## License

MIT
