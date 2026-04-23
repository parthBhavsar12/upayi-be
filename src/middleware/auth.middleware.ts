import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = verifyToken(token) as { id: string };
    const user = await User.findById(decoded.id).select('isVerified');
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Email not verified. Please verify your email before accessing this resource.',
      });
    }
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};
