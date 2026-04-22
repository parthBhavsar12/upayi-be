import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { encrypt, decrypt, hmacHash } from '../utils/crypto.js';
import { config } from '../config/env.js';

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, upiId, password } = req.body;

    // Generate HMAC hash for indexed lookup & uniqueness check
    const upiIdHash = hmacHash(upiId, config.hmacSecret);

    // Check if user already exists (by email or UPI ID hash)
    const userExists = await User.findOne({ $or: [{ email }, { upiIdHash }] });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email or UPI ID already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Encrypt UPI ID for storage
    const encryptedUpiId = encrypt(upiId, config.aesSecret);

    // Create user
    const user = await User.create({
      name,
      email,
      upiId: encryptedUpiId,
      upiIdHash,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        upiId: decrypt(user.upiId, config.aesSecret), // return plain UPI ID to client
        token: generateToken(user._id.toString()),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    next(error);
  }
};

export const signin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        upiId: decrypt(user.upiId, config.aesSecret), // decrypt before sending
        token: generateToken(user._id.toString()),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    next(error);
  }
};
