import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Interview Helper API',
    version: '1.0.0',
    description: 'A production-ready Node.js API for interview assistance',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`,
      description: 'Development server',
    },
  ],
  tags: [
    {
      name: 'Health',
      description: 'API health check endpoints',
    },
    {
      name: 'Auth',
      description: 'Authentication endpoints',
    },
    {
      name: 'Users',
      description: 'User management endpoints',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'error',
          },
          message: {
            type: 'string',
            example: 'Error message',
          },
        },
      },
      HealthCheck: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'ok',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2023-01-01T00:00:00.000Z',
          },
          uptime: {
            type: 'number',
            example: 123.45,
          },
          environment: {
            type: 'string',
            example: 'development',
          },
          version: {
            type: 'string',
            example: '1.0.0',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '60d0fe4f5311236168a109ca',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          username: {
            type: 'string',
            example: 'johndoe',
          },
          name: {
            type: 'string',
            example: 'John Doe',
          },
          profilePicture: {
            type: 'string',
            format: 'uri',
            example: 'https://example.com/profile.jpg',
          },
          role: {
            type: 'string',
            enum: ['ADMIN', 'USER'],
            example: 'USER',
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE', 'BANNED'],
            example: 'ACTIVE',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-01-01T00:00:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-01-01T00:00:00.000Z',
          },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: {
            $ref: '#/components/schemas/User',
          },
          accessToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          refreshToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
    },
    responses: {
      NotFound: {
        description: 'The specified resource was not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      InternalError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
