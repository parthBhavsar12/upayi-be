import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { encrypt, decrypt, hmacHash } from '../utils/crypto.js';
import { config } from '../config/env.js';
import {
  generateEmailVerificationToken,
  generateResetPasswordToken,
  verifyActionToken,
} from '../utils/authTokens.js';
import { sendResetPasswordEmail, sendVerificationEmail } from '../services/email.service.js';

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
      const verificationToken = generateEmailVerificationToken(user._id.toString());
      user.tokens = {
        ...(user.tokens || {}),
        emailVerification: verificationToken,
        resetPassword: user.tokens?.resetPassword ?? null,
      };
      await user.save();

      try {
        await sendVerificationEmail(user.email, verificationToken);
      } catch (err) {
        // Intentionally do not fail signup if email sending fails.
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        upiId: decrypt(user.upiId, config.aesSecret), // return plain UPI ID to client
        isVerified: user.isVerified,
        message: 'Signup successful. Please verify your email before logging in.',
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
      if (!user.isVerified) {
        return res.status(403).json({
          message: 'Email not verified. Please verify your email before logging in.',
        });
      }

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

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = (req.body?.token as string | undefined) || (req.query?.token as string | undefined);
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    let userId: string;
    try {
      userId = verifyActionToken(token, 'email_verification');
    } catch (err: any) {
      if (err?.name === 'TokenExpiredError') {
        return res.status(400).json({ message: 'Verification token expired' });
      }
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    if (user.isVerified) {
      if (user.tokens?.emailVerification) {
        user.tokens.emailVerification = null;
        await user.save();
      }
      return res.json({ message: 'Email is already verified' });
    }

    if (!user.tokens?.emailVerification || user.tokens.emailVerification !== token) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    user.isVerified = true;
    user.tokens.emailVerification = null;
    await user.save();

    return res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body as { email?: string };

    if (email) {
      const user = await User.findOne({ email });
      if (user) {
        const resetToken = generateResetPasswordToken(user._id.toString());
        user.tokens = {
          ...(user.tokens || {}),
          resetPassword: resetToken,
          emailVerification: user.tokens?.emailVerification ?? null,
        };
        await user.save();

        try {
          await sendResetPasswordEmail(user.email, resetToken);
        } catch (err) {
          // Intentionally do not leak email provider errors to clients.
        }
      }
    }

    // Avoid leaking whether the email exists
    return res.json({ message: 'If an account exists, a reset password email has been sent.' });
  } catch (error) {
    next(error);
  }
};

export const resendVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body as { email?: string };

    if (email) {
      const user = await User.findOne({ email });
      if (user && !user.isVerified) {
        const verificationToken = generateEmailVerificationToken(user._id.toString());
        user.tokens = {
          ...(user.tokens || {}),
          emailVerification: verificationToken,
          resetPassword: user.tokens?.resetPassword ?? null,
        };
        await user.save();

        try {
          await sendVerificationEmail(user.email, verificationToken);
        } catch {
          // Intentionally do not leak email provider errors to clients.
        }
      }
    }

    return res.json({ message: 'If an account exists, a verification email has been sent.' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = (req.body?.token as string | undefined) || (req.query?.token as string | undefined);
    const newPassword = req.body?.newPassword as string | undefined;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    let userId: string;
    try {
      userId = verifyActionToken(token, 'reset_password');
    } catch (err: any) {
      if (err?.name === 'TokenExpiredError') {
        return res.status(400).json({ message: 'Reset password token expired' });
      }
      return res.status(400).json({ message: 'Invalid reset password token' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: 'Invalid reset password token' });
    }

    if (!user.tokens?.resetPassword || user.tokens.resetPassword !== token) {
      return res.status(400).json({ message: 'Invalid reset password token' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.tokens.resetPassword = null;
    await user.save();

    return res.json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};
