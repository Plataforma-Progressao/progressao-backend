import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserOnboardingService } from './user-onboarding.service';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UserOnboardingService],
  exports: [UsersService, UserOnboardingService],
})
export class UsersModule {}
