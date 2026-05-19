import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { LoginHandler } from './commands/login.handler';
import { RefreshTokenHandler } from './commands/refresh-token.handler';
import { LogoutHandler } from './commands/logout.handler';

const handlers = [LoginHandler, RefreshTokenHandler, LogoutHandler];

@Module({
  imports: [CqrsModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [...handlers],
})
export class AuthModule {}
