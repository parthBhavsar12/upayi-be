import { Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { encrypt, decrypt, hmacHash } from '../utils/crypto.js';
import { config } from '../config/env.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      upiId: decrypt(user.upiId, config.aesSecret),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user profile', error });
  }
};

export const updateUpiId = async (req: AuthRequest, res: Response) => {
  try {
    const { upiId } = req.body;

    if (!upiId) {
      return res.status(400).json({ message: 'UPI ID is required' });
    }

    const user = await User.findById(req.user?.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const upiIdHash = hmacHash(upiId, config.hmacSecret);
    
    // Check if new UPI ID belongs to another user
    const existingUser = await User.findOne({ upiIdHash });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({ message: 'This UPI ID is already registered' });
    }

    user.upiId = encrypt(upiId, config.aesSecret);
    user.upiIdHash = upiIdHash;

    await user.save();

    res.json({
      message: 'UPI ID updated successfully',
      upiId: decrypt(user.upiId, config.aesSecret),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update UPI ID', error });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old password and new password are required' });
    }

    const user = await User.findById(req.user?.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect old password' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to change password', error });
  }
};
