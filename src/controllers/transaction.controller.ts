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
    const { search, filter, date, startDate, endDate, timezone } = req.query;
    
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
    
    // Handle different filter types
    if (filter === 'today') {
      // Today's data in user's timezone
      const today = new Date().toLocaleDateString('en-US', { timeZone: timezone as string || 'UTC' });
      const { startOfDay, endOfDay } = getDateRangeInTimezone(today);
      
      query.createdAt = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    } else if (filter === 'yesterday') {
      // Yesterday's data in user's timezone
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toLocaleDateString('en-US', { timeZone: timezone as string || 'UTC' });
      const { startOfDay, endOfDay } = getDateRangeInTimezone(yesterdayString);
      
      query.createdAt = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    } else if (filter === 'thisMonth') {
      // This month's data in user's timezone
      const now = new Date();
      const userTimezone = timezone as string || 'UTC';
      
      // Get first day of current month in user's timezone
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayInTimezone = new Date(firstDay.toLocaleString('en-US', { timeZone: userTimezone }));
      firstDayInTimezone.setHours(0, 0, 0, 0);
      
      // Get last day of current month in user's timezone
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const lastDayInTimezone = new Date(lastDay.toLocaleString('en-US', { timeZone: userTimezone }));
      lastDayInTimezone.setHours(23, 59, 59, 999);
      
      query.createdAt = {
        $gte: firstDayInTimezone,
        $lte: lastDayInTimezone
      };
    } else if (filter === 'lastMonth') {
      // Last month's data in user's timezone
      const now = new Date();
      const userTimezone = timezone as string || 'UTC';
      
      // Get first day of last month
      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const firstDayInTimezone = new Date(firstDayOfLastMonth.toLocaleString('en-US', { timeZone: userTimezone }));
      firstDayInTimezone.setHours(0, 0, 0, 0);
      
      // Get last day of last month
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const lastDayInTimezone = new Date(lastDayOfLastMonth.toLocaleString('en-US', { timeZone: userTimezone }));
      lastDayInTimezone.setHours(23, 59, 59, 999);
      
      query.createdAt = {
        $gte: firstDayInTimezone,
        $lte: lastDayInTimezone
      };
    } else if (filter === 'last3Months') {
      // Last 3 months' data in user's timezone
      const now = new Date();
      const userTimezone = timezone as string || 'UTC';
      
      // Get first day of 3 months ago
      const firstDayOf3MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      const firstDayInTimezone = new Date(firstDayOf3MonthsAgo.toLocaleDateString('en-US', { timeZone: userTimezone }));
      firstDayInTimezone.setHours(0, 0, 0, 0);
      
      // Get end of current day
      const today = new Date();
      const todayInTimezone = new Date(today.toLocaleDateString('en-US', { timeZone: userTimezone }));
      todayInTimezone.setHours(23, 59, 59, 999);
      
      query.createdAt = {
        $gte: firstDayInTimezone,
        $lte: todayInTimezone
      };
    } else if (filter === 'lastYear') {
      // Last year's data in user's timezone
      const now = new Date();
      const userTimezone = timezone as string || 'UTC';
      
      // Get first day of last year
      const firstDayOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
      const firstDayInTimezone = new Date(firstDayOfLastYear.toLocaleString('en-US', { timeZone: userTimezone }));
      firstDayInTimezone.setHours(0, 0, 0, 0);
      
      // Get last day of last year
      const lastDayOfLastYear = new Date(now.getFullYear() - 1, 11, 31);
      const lastDayInTimezone = new Date(lastDayOfLastYear.toLocaleString('en-US', { timeZone: userTimezone }));
      lastDayInTimezone.setHours(23, 59, 59, 999);
      
      query.createdAt = {
        $gte: firstDayInTimezone,
        $lte: lastDayInTimezone
      };
    } else if (filter === 'currentYear') {
      // Current year's data in user's timezone
      const now = new Date();
      const userTimezone = timezone as string || 'UTC';
      
      // Get first day of current year in user's timezone
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
      const firstDayInTimezone = new Date(firstDayOfYear.toLocaleDateString('en-US', { timeZone: userTimezone }));
      firstDayInTimezone.setHours(0, 0, 0, 0);
      
      // Get end of current day (not yesterday) for current year
      const today = new Date();
      const todayInTimezone = new Date(today.toLocaleDateString('en-US', { timeZone: userTimezone }));
      todayInTimezone.setHours(23, 59, 59, 999);
      
      query.createdAt = {
        $gte: firstDayInTimezone,
        $lte: todayInTimezone
      };
    } else if (filter === 'singleDate' && date) {
      // Single specific date in user's timezone
      const { startOfDay, endOfDay } = getDateRangeInTimezone(date as string);
      
      query.createdAt = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    } else if (filter === 'customRange' && startDate && endDate) {
      // Custom date range in user's timezone
      const { startOfDay } = getDateRangeInTimezone(startDate as string);
      const { endOfDay } = getDateRangeInTimezone(endDate as string);
      
      query.createdAt = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }
    // If no filter is specified, default to today
    else if (!filter) {
      const today = new Date().toLocaleDateString('en-US', { timeZone: timezone as string || 'UTC' });
      const { startOfDay, endOfDay } = getDateRangeInTimezone(today);
      
      query.createdAt = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    // Add search filter if provided (only search by amount)
    if (search) {
      const searchTerm = search as string;
      const isNumeric = !isNaN(parseFloat(searchTerm)) && isFinite(parseFloat(searchTerm));

      if (isNumeric) {
        // Search by exact amount
        query.amount = parseFloat(searchTerm);
      }
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
