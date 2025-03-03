import { PrismaClient, UserRole, Provider } from '@prisma/client';
import bcrypt from 'bcrypt';
import { log } from '../src/utils/logger';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  try {
    log.info('Starting database seed...');
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: UserRole.ADMIN,
      },
    });
    
    if (existingAdmin) {
      log.info('Admin user already exists, skipping creation.');
    } else {
      // Create admin user
      const hashedPassword = await hashPassword('qwerty@123');
      
      const admin = await prisma.user.create({
        data: {
          email: 'interviewhelper@gmai.com',
          username: 'admin',
          password: hashedPassword,
          name: 'Admin User',
          role: UserRole.ADMIN,
          socialLogins: {
            create: {
              provider: Provider.LOCAL,
              providerId: 'interviewhelper@gmai.com',
            },
          },
        },
      });
      
      log.info(`Created admin user with ID: ${admin.id}`);
    }
    
    log.info('Database seed completed successfully!');
  } catch (error) {
    log.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
