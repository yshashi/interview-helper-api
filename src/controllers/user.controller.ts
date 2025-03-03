import type { Request, Response } from 'express';
import { 
  getUserById, 
  updateUser, 
  deleteUser, 
  updateUserRole, 
  updateUserStatus,
  listUsers
} from '../services/user.service.js';
import type { UpdateUserInput } from '../services/user.service.js';
import { UserRole, UserStatus } from '../config/database.js';
import { log } from '../utils/logger.js';

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    const user = await getUserById(userId);
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    res.status(200).json(user);
  } catch (error) {
    log.error('Error getting user', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to get user' });
  }
};

export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    const updateData: UpdateUserInput = req.body;
    
    const updatedUser = await updateUser(userId, updateData);
    res.status(200).json(updatedUser);
  } catch (error) {
    log.error('Error updating user', { error: error instanceof Error ? error.message : String(error) });
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update user' });
  }
};

export const removeUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    await deleteUser(userId);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    log.error('Error deleting user', { error: error instanceof Error ? error.message : String(error) });
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to delete user' });
  }
};

export const changeUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    
    if (!Object.values(UserRole).includes(role)) {
      res.status(400).json({ message: 'Invalid role' });
      return;
    }
    
    const updatedUser = await updateUserRole(userId, role);
    res.status(200).json(updatedUser);
  } catch (error) {
    log.error('Error updating user role', { error: error instanceof Error ? error.message : String(error) });
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update user role' });
  }
};

export const changeUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    const { status } = req.body;
    
    if (!Object.values(UserStatus).includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }
    
    const updatedUser = await updateUserStatus(userId, status);
    res.status(200).json(updatedUser);
  } catch (error) {
    log.error('Error updating user status', { error: error instanceof Error ? error.message : String(error) });
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update user status' });
  }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await listUsers(page, limit);
    res.status(200).json(result);
  } catch (error) {
    log.error('Error listing users', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to list users' });
  }
};
