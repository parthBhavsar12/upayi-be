import dotenv from 'dotenv';

dotenv.config();

const getEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

const getOptionalEnvVar = (key: string, fallback: string | null = null): string | null => {
  const value = process.env[key];
  if (!value) return fallback;
  return value;
};

export const config = {
  port: process.env.PORT || '3000',
  mongodbUri: getEnvVar('MONGODB_URI'),
  jwtSecret: getEnvVar('JWT_SECRET'),
  frontendUrl: getEnvVar('FRONTEND_URL'),
  aesSecret: getEnvVar('AES_SECRET'),
  hmacSecret: getEnvVar('HMAC_SECRET'),

  // Email/link configuration
  backendUrl: getOptionalEnvVar('BACKEND_URL'),

  // SMTP configuration
  smtpUser: getEnvVar('SMTP_USER'),
  smtpPass: getEnvVar('SMTP_PASSWORD'),
  smtpService: getOptionalEnvVar('SMTP_SERVICE'),
};
