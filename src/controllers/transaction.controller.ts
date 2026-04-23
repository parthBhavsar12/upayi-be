import { Response } from 'express';
import Transaction from '../models/Transaction.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const saveTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { amount } = req.body;
    
    if (!amount) {
      return res.status(400).json({ message: 'Amount is required' });
    }

    const transaction = await Transaction.create({
      amount: Number(amount),
      user_id: req.user?.id,
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save transaction', error });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { search, date } = req.query;
    
    // Build query filter
    let query: any = { user_id: req.user?.id };
    
    // Add date filter if provided
    if (date) {
      const targetDate = new Date(date as string);
      const startOfDay = new Date(targetDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      
      query.createdAt = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }
    
    // Add search filter if provided (search by transaction ID or amount)
    if (search) {
      const searchTerm = search as string;
      query.$or = [
        { _id: { $regex: searchTerm, $options: 'i' } },
        { amount: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    const transactions = await Transaction.find(query).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch transactions', error });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const transaction = await Transaction.findOne({ _id: id, user_id: req.user?.id });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found or unauthorized' });
    }

    await transaction.deleteOne();
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete transaction', error });
  }
};
