import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma, Provider, type User } from '../config/database.js';
import { env } from '../config/env.js';
import { log } from '../utils/logger.js';

// Types
export interface RegisterUserInput {
  email: string;
  username?: string;
  password: string;
  name?: string;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface SocialLoginInput {
  provider: Provider;
  providerId: string;
  email: string;
  name?: string;
  profilePicture?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthResult {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
}

// Helper functions
const generateTokens = (user: User): { accessToken: string; refreshToken: string } => {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  // @ts-ignore - JWT sign options
  const accessToken = jwt.sign(payload, env.JWT_SECRET || 'default-secret', {
    expiresIn: env.JWT_EXPIRES_IN || '1h',
  });

  // @ts-ignore - JWT sign options
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET || 'default-refresh-secret', {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  return { accessToken, refreshToken };
};

const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePasswords = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

const sanitizeUser = (user: User): Omit<User, 'password'> => {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};

// Auth service functions
export const registerUser = async (userData: RegisterUserInput): Promise<AuthResult> => {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: userData.email,
        username: userData.username,
        password: hashedPassword,
        name: userData.name,
        socialLogins: {
          create: {
            provider: Provider.LOCAL,
            providerId: userData.email,
          },
        },
      },
      include: {
        socialLogins: true,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(newUser);

    // Create session
    await prisma.session.create({
      data: {
        token: refreshToken,
        userId: newUser.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return {
      user: sanitizeUser(newUser),
      accessToken,
      refreshToken,
    };
  } catch (error) {
    log.error('Error registering user', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

export const loginUser = async (loginData: LoginUserInput): Promise<AuthResult> => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: loginData.email },
    });

    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await comparePasswords(loginData.password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const { accessToken, refreshToken } = generateTokens(user);

    await prisma.session.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  } catch (error) {
    log.error('Error logging in user', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

export const socialLogin = async (socialData: SocialLoginInput): Promise<AuthResult> => {
  try {
    const existingSocialLogin = await prisma.socialLogin.findUnique({
      where: {
        provider_providerId: {
          provider: socialData.provider,
          providerId: socialData.providerId,
        },
      },
      include: {
        user: true,
      },
    });

    let user: User;

    if (existingSocialLogin) {
      await prisma.socialLogin.update({
        where: {
          id: existingSocialLogin.id,
        },
        data: {
          accessToken: socialData.accessToken,
          refreshToken: socialData.refreshToken,
        },
      });

      user = existingSocialLogin.user;
    } else {
      const existingUser = await prisma.user.findUnique({
        where: { email: socialData.email },
      });

      if (existingUser) {
        await prisma.socialLogin.create({
          data: {
            provider: socialData.provider,
            providerId: socialData.providerId,
            userId: existingUser.id,
            accessToken: socialData.accessToken,
            refreshToken: socialData.refreshToken,
          },
        });

        user = existingUser;
      } else {
        user = await prisma.user.create({
          data: {
            email: socialData.email,
            name: socialData.name,
            username: socialData.email.split('@')[0],
            profilePicture: socialData.profilePicture,
            socialLogins: {
              create: {
                provider: socialData.provider,
                providerId: socialData.providerId,
                accessToken: socialData.accessToken,
                refreshToken: socialData.refreshToken,
              },
            },
          },
        });
      }
    }

    const { accessToken, refreshToken } = generateTokens(user);

    await prisma.session.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  } catch (error) {
    log.error('Error with social login', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

export const refreshToken = async (token: string): Promise<{ accessToken: string; refreshToken: string }> => {
  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || new Date() > session.expiresAt) {
      throw new Error('Invalid or expired refresh token');
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(session.user);

    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    log.error('Error refreshing token', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

export const logoutUser = async (token: string): Promise<void> => {
  try {
    await prisma.session.delete({
      where: { token },
    });
  } catch (error) {
    log.error('Error logging out user', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};
