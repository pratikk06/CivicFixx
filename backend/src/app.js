import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import healthRouter from './routes/health.js';
import profileRouter from './routes/profile.js';

import aiRouter from './routes/ai.js';
app.use('/api/v1/ai', aiRouter);

import authRouter from './routes/auth.js';
import issuesRouter from './routes/issues.js';
app.use('/api/v1/issues', issuesRouter);

import notFoundHandler from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use(morgan('dev'));

// API version prefix
app.use('/api/v1', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/profile', profileRouter);

// 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
