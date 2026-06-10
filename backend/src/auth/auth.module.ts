import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller'; 
import { ClerkAuthGuard } from './clerk-auth.guard';
import { UsersModule } from '../users/users.module';


@Module({
 
  providers: [ClerkAuthGuard],
  controllers: [AuthController],
  imports: [forwardRef(() => UsersModule)],
  exports: [ClerkAuthGuard],
})
export class AuthModule {}
