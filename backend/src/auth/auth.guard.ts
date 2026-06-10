// Guard to authenticate users with Clerk and sync db records
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private clerk;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.clerk = createClerkClient({
      secretKey: this.configService.get('CLERK_SECRET_KEY'),
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Clerk's getToken() returns a JWT token
      // Decode it to get the user ID (sub claim)
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new UnauthorizedException('Invalid token format');
      }

      // Decode the JWT payload (base64url decode)
      const payload = JSON.parse(
        Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(),
      );

      if (!payload.sub) {
        throw new UnauthorizedException('Invalid token: missing user ID');
      }

      // Get user details from Clerk
      const clerkUser = await this.clerk.users.getUser(payload.sub);

      if (!clerkUser) {
        throw new UnauthorizedException('User not found');
      }

      // Fetch user from database
      let user = await this.prisma.user.findUnique({
        where: { clerkId: clerkUser.id },
      });

      // Auto-provision: if the Clerk user has no local DB record yet, create one now
      // so that first-time users aren't blocked with a 401.
      if (!user) {
        const primaryEmail =
          clerkUser.emailAddresses?.find(
            (e) => e.id === clerkUser.primaryEmailAddressId,
          )?.emailAddress ??
          clerkUser.emailAddresses?.[0]?.emailAddress ??
          '';

        user = await this.prisma.user.upsert({
          where: { clerkId: clerkUser.id },
          update: {},
          create: {
            clerkId: clerkUser.id,
            email: primaryEmail,
            firstName: clerkUser.firstName ?? null,
            lastName: clerkUser.lastName ?? null,
            isActive: true,
          },
        });
      }

      if (!user.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }

      // Attach user to request with role info
      request.user = {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('AuthGuard error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}
