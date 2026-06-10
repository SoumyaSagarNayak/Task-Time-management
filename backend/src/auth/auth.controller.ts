import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { UsersService } from '../users/users.service';

type ClerkRequest = {
  clerkUserId: string;
};

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Post('ensure-user')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Ensure user exists with defaults' })
  @ApiResponse({ status: 200, description: 'User ensured' })
  async ensureUser(@Req() req: ClerkRequest) {
    return this.usersService.ensureUserExists(req.clerkUserId);
  }
}