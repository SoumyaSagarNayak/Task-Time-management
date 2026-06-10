import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserData } from '../auth/decorators/current-user.decorator';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAllActive(user: CurrentUserData) {
    const where: Prisma.UserWhereInput = { isActive: true };

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { firstName: 'asc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        department: true,
      },
    });

    return users.map((u) => {
      const first = u.firstName || '';
      const last = u.lastName || '';
      const fullName =
        [first, last].filter(Boolean).join(' ') || u.email.split('@')[0];
      const initials =
        (first.charAt(0) + last.charAt(0)).toUpperCase() ||
        fullName.charAt(0).toUpperCase();

      return {
        id: u.id,
        fullName,
        initials,
        email: u.email,
        avatarUrl: u.avatarUrl || undefined,
        department: u.department || undefined,
      };
    });
  }
}
