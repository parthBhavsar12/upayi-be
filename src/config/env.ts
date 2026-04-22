import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT,
  mongodbUri: process.env.MONGODB_URI!,
  jwtSecret: process.env.JWT_SECRET,
  frontendUrl: process.env.FRONTEND_URL,
  aesSecret: process.env.AES_SECRET!,
  hmacSecret: process.env.HMAC_SECRET!,
};
