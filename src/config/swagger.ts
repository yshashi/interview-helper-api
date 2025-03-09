import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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
      url: env.API_URL,
      description: 'API server',
    },
    {
      url: `http://localhost:${env.PORT}`,
      description: 'Local development server',
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
    {
      name: 'MCQ',
      description: 'Multiple Choice Questions endpoints',
    },
    {
      name: 'Quiz Results',
      description: 'User quiz results endpoints',
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
      Options: {
        type: 'object',
        properties: {
          A: {
            type: 'string',
            example: 'First option',
          },
          B: {
            type: 'string',
            example: 'Second option',
          },
          C: {
            type: 'string',
            example: 'Third option',
          },
          D: {
            type: 'string',
            example: 'Fourth option',
          },
        },
      },
      Question: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            example: 'What is the capital of France?',
          },
          options: {
            $ref: '#/components/schemas/Options',
          },
          correct_answer: {
            type: 'string',
            example: 'A',
          },
          question_id: {
            type: 'integer',
            example: 1,
          },
          source_file: {
            type: 'string',
            example: 'geography.json',
          },
        },
      },
      MCQ: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            example: 'javascript',
          },
          questions: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Question',
            },
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
      MCQKeysResponse: {
        type: 'object',
        properties: {
          keys: {
            type: 'array',
            items: {
              type: 'string',
              example: 'javascript',
            },
          },
        },
      },
      UserQuizResult: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '60d0fe4f5311236168a109ca',
          },
          userId: {
            type: 'string',
            example: '60d0fe4f5311236168a109cb',
          },
          mcqId: {
            type: 'string',
            example: '60d0fe4f5311236168a109cc',
          },
          totalTimeTaken: {
            type: 'integer',
            example: 300,
          },
          correctAnswerCount: {
            type: 'integer',
            example: 8,
          },
          wrongAnswerCount: {
            type: 'integer',
            example: 2,
          },
          attemptCount: {
            type: 'integer',
            example: 1,
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
          mcq: {
            type: 'object',
            properties: {
              key: {
                type: 'string',
                example: 'javascript',
              },
            },
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = {
  swaggerDefinition,
  apis: [__dirname + '/../routes/*.js'],
};

const localOptions = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts'],
}
export const swaggerSpec = swaggerJsdoc(env.NODE_ENV === 'production' ? options : localOptions);
