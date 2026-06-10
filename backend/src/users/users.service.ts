// Service to manage users and integrate with Clerk
import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserData } from '../auth/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { TaskPriority, TaskStatus } from '@prisma/client';
@Injectable()
export class UsersService {
  private clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

  constructor(private prisma: PrismaService) { }

  async syncUserFromClerk(
    clerkUser: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    },
  ) {
    // Upsert user from Clerk data
    const user = await this.prisma.user.upsert({
      where: { clerkId: clerkUser.id },
      update: {
        email: clerkUser.email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
      },
      create: {
        clerkId: clerkUser.id,
        email: clerkUser.email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
      },
    });

    return user;
  }

  async ensureUserExists(clerkId: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (existingUser) {
      return { user: existingUser, created: false };
    }

    const clerkUser = await this.clerkClient.users.getUser(clerkId);
    if (!clerkUser) {
      throw new NotFoundException('Clerk user not found');
    }

    const newUser = await this.prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName || null,
        lastName: clerkUser.lastName || null,
        avatarUrl: clerkUser.imageUrl || null,
      },
    });

    return {
      user: newUser,
      created: true,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update local database
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: updateUserDto.firstName,
        lastName: updateUserDto.lastName,
        email: updateUserDto.email,
      },
    });

    // Sync with Clerk
    try {
      await this.clerkClient.users.updateUser(user.clerkId, {
        firstName: updateUserDto.firstName,
        lastName: updateUserDto.lastName,
      });
    } catch (error) {
      console.error('Failed to sync with Clerk:', error);
    }

    return updatedUser;
  }

  async findAll(user: CurrentUserData) {
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            assignedTasks: true,
            timeEntries: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  async findOne(id: string, user: CurrentUserData) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assignedTasks: true,
            timeEntries: true,
          },
        },
      },
    });

    if (!foundUser || !foundUser.isActive) {
      throw new NotFoundException('User not found');
    }

    return foundUser;
  }
}
