import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

const JWT_EXPIRES_IN = '7d';

export const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, config.jwtSecret);
};
