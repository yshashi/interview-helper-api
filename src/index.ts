import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import passport from 'passport';
import { env } from './config/env.js';
import { log, createRequestLogger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createRateLimiter } from './middleware/rateLimiter.js';
import { swaggerSpec } from './config/swagger.js';
import { setupGlobalErrorHandlers } from './utils/errors.js';
import { connectToDatabase, disconnectFromDatabase } from './config/database.js';
import './config/passport.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import mcqRoutes from './routes/mcq.routes.js';
import quizResultRoutes from './routes/quiz-result.routes.js';
import topicwiseMcqRoutes from './routes/topicwise-mcq.routes.js';
import topicwiseQuizResultRoutes from './routes/topicwise-quiz-result.routes.js';

setupGlobalErrorHandlers();

connectToDatabase();

const app = express();

app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://interviewhelper.in',
      'https://www.interviewhelper.in',
      'http://localhost:4321',
      env.CLIENT_URL
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(createRequestLogger());
app.use(createRateLimiter());

app.use(passport.initialize());

// Routes
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mcq', mcqRoutes);
app.use('/api/quiz-results', quizResultRoutes);
app.use('/api/topicwise-mcq', topicwiseMcqRoutes);
app.use('/api/topicwise-quiz-results', topicwiseQuizResultRoutes);

// Redirect root to API docs
app.get('/', (_req, res) => {
  res.redirect('/api-docs');
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(parseInt(env.PORT), '0.0.0.0', () => {
  log.info(`Server started on 0.0.0.0:${env.PORT} in ${env.NODE_ENV} mode`);
  log.info(`Swagger documentation available at http://localhost:${env.PORT}/api-docs`);
});

const gracefulShutdown = async (signal: string): Promise<void> => {
  log.info(`Received ${signal}. Shutting down gracefully...`);
  
  server.close(async () => {
    log.info('HTTP server closed');
    
    await disconnectFromDatabase();
    
    process.exit(0);
  });
  
  setTimeout(() => {
    log.error('Could not close connections in time, forcefully shutting down', { signal });
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
