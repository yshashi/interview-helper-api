import type { Request, Response } from 'express';
import { 
  registerUser, 
  loginUser, 
  refreshToken, 
  logoutUser,
  socialLogin
} from '../services/auth.service.js';

import { log } from '../utils/logger.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;
    const result = await registerUser({ email, password, name });
    res.status(201).json(result);
  } catch (error) {
    log.error('Error registering user', { error: error instanceof Error ? error.message : String(error) });
    res.status(400).json({ message: error instanceof Error ? error.message : 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await loginUser({ email, password });
    res.status(200).json(result);
  } catch (error) {
    log.error('Error logging in user', { error: error instanceof Error ? error.message : String(error) });
    res.status(401).json({ message: error instanceof Error ? error.message : 'Authentication failed' });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    const result = await refreshToken(token);
    res.status(200).json(result);
  } catch (error) {
    log.error('Error refreshing token', { error: error instanceof Error ? error.message : String(error) });
    res.status(401).json({ message: error instanceof Error ? error.message : 'Token refresh failed' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    await logoutUser(token);
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    log.error('Error logging out user', { error: error instanceof Error ? error.message : String(error) });
    res.status(400).json({ message: error instanceof Error ? error.message : 'Logout failed' });
  }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    const result = await socialLogin(token);
    res.status(200).json(result);
  } catch (error) {
    log.error('Error with Google login', { error: error instanceof Error ? error.message : String(error) });
    res.status(401).json({ message: error instanceof Error ? error.message : 'Google authentication failed' });
  }
};

export const githubLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.body;
    const result = await socialLogin(code);
    res.status(200).json(result);
  } catch (error) {
    log.error('Error with GitHub login', { error: error instanceof Error ? error.message : String(error) });
    res.status(401).json({ message: error instanceof Error ? error.message : 'GitHub authentication failed' });
  }
};
