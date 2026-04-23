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
    const { search, date, all, timezone } = req.query;
    
    // Build query filter
    let query: any = { user_id: req.user?.id };
    
    // Helper function to get date range in user's timezone
    const getDateRangeInTimezone = (dateString: string) => {
      const targetDate = new Date(dateString);
      const userTimezone = timezone as string || 'UTC';
      
      // Get start of day in user's timezone
      const startOfDay = new Date(targetDate.toLocaleString('en-US', { timeZone: userTimezone }));
      startOfDay.setHours(0, 0, 0, 0);
      
      // Get end of day in user's timezone
      const endOfDay = new Date(targetDate.toLocaleString('en-US', { timeZone: userTimezone }));
      endOfDay.setHours(23, 59, 59, 999);
      
      return { startOfDay, endOfDay };
    };
    
    // Default to today's data unless 'all' parameter is provided
    if (all === 'true') {
      // Fetch all data - no date filter
    } else if (date) {
      // Specific date filter in user's timezone
      const { startOfDay, endOfDay } = getDateRangeInTimezone(date as string);
      
      query.createdAt = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    } else {
      // Default: today's data in user's timezone
      const today = new Date().toLocaleDateString('en-US', { timeZone: timezone as string || 'UTC' });
      const { startOfDay, endOfDay } = getDateRangeInTimezone(today);
      
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
    
    // Convert timestamps to user's timezone for display
    const userTimezone = timezone as string || 'UTC';
    const transactionsWithLocalTime = transactions.map(transaction => {
      const localDate = new Date(transaction.createdAt).toLocaleString('en-US', { 
        timeZone: userTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      return {
        ...transaction.toObject(),
        createdAt: transaction.createdAt, // Keep original for sorting
        localCreatedAt: localDate // Add local time for display
      };
    });
    
    res.json(transactionsWithLocalTime);
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
