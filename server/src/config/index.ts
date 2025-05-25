import dotenv from 'dotenv';

dotenv.config();

export const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'video/mp4',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export type AllowedMimeType = typeof allowedMimeTypes[number];

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiration: '24h',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  uploadDir: 'uploads',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: allowedMimeTypes,
} as const;

export type Config = typeof config;
