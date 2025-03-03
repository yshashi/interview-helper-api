import { prisma, type User, UserRole, UserStatus } from '../config/database.js';
import { log } from '../utils/logger.js';

// Types
export interface UpdateUserInput {
  username?: string;
  name?: string;
  profilePicture?: string;
}

export const getUserById = async (id: string): Promise<User | null> => {
  try {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        socialLogins: true,
      },
    });
  } catch (error) {
    log.error('Error getting user by ID', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        socialLogins: true,
      },
    });
  } catch (error) {
    log.error('Error getting user by email', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

export const updateUser = async (id: string, userData: UpdateUserInput): Promise<User> => {
  try {
    return await prisma.user.update({
      where: { id },
      data: userData,
    });
  } catch (error) {
    log.error('Error updating user', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  try {
    await prisma.user.delete({
      where: { id },
    });
  } catch (error) {
    log.error('Error deleting user', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

export const updateUserRole = async (id: string, role: UserRole): Promise<User> => {
  try {
    return await prisma.user.update({
      where: { id },
      data: { role },
    });
  } catch (error) {
    log.error('Error updating user role', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

export const updateUserStatus = async (id: string, status: UserStatus): Promise<User> => {
  try {
    return await prisma.user.update({
      where: { id },
      data: { status },
    });
  } catch (error) {
    log.error('Error updating user status', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

export const listUsers = async (
  page = 1,
  limit = 10,
  role?: UserRole,
  status?: UserStatus
): Promise<{ users: User[]; total: number; page: number; limit: number }> => {
  try {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          socialLogins: true,
        },
      }),
      prisma.user.count({ where }),
    ]);
    
    return {
      users,
      total,
      page,
      limit,
    };
  } catch (error) {
    log.error('Error listing users', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};
