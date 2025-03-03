import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { log, createRequestLogger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createRateLimiter } from './middleware/rateLimiter.js';
import { swaggerSpec } from './config/swagger.js';
import { setupGlobalErrorHandlers } from './utils/errors.js';
import healthRoutes from './routes/health.js';

// Set up global error handlers for uncaught exceptions
setupGlobalErrorHandlers();

// Create Express application
const app = express();

// Apply basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(createRequestLogger());

app.use(createRateLimiter());


app.use('/health', healthRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(notFoundHandler);

app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  log.info(`Server started on port ${env.PORT} in ${env.NODE_ENV} mode`);
  log.info(`Swagger documentation available at http://localhost:${env.PORT}/api-docs`);
});

const gracefulShutdown = (signal: string): void => {
  log.info(`Received ${signal}. Shutting down gracefully...`);
  
  server.close(() => {
    log.info('HTTP server closed');
    process.exit(0);
  });
  
  setTimeout(() => {
    log.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
