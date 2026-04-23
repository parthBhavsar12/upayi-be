import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

type ActionTokenType = 'email_verification' | 'reset_password';

type ActionTokenPayload = {
  id: string;
  type: ActionTokenType;
};

export const generateEmailVerificationToken = (userId: string) => {
  return jwt.sign({ id: userId, type: 'email_verification' } satisfies ActionTokenPayload, config.jwtSecret, {
    expiresIn: '24h',
  });
};

export const generateResetPasswordToken = (userId: string) => {
  return jwt.sign({ id: userId, type: 'reset_password' } satisfies ActionTokenPayload, config.jwtSecret, {
    expiresIn: '1h',
  });
};

export const verifyActionToken = (token: string, expectedType: ActionTokenType): string => {
  const decoded = jwt.verify(token, config.jwtSecret) as ActionTokenPayload;
  if (decoded.type !== expectedType) {
    throw new Error('Invalid token');
  }
  return decoded.id;
};

