# Nodejs Typescript template

A production-ready Node.js API built with TypeScript and functional programming principles.

## Features

- TypeScript with ES Modules
- Functional programming approach
- Express.js for API routes
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

Edit the `.env` file to customize your configuration.

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

The server will be available at http://localhost:3000.

## API Documentation

Swagger documentation is available at http://localhost:3000/api-docs when the server is running.

## Production

To build and run the application in production mode:

```bash
npm run build
npm start
```

## Docker

To build and run the application using Docker:

```bash
npm run docker:build
npm run docker:run
```

## Project Structure

```
interview-helper-api/
├── src/                  # Source code
│   ├── config/           # Configuration files
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript type definitions
│   └── index.ts          # Application entry point
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

## License

MIT
