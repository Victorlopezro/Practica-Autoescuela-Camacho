import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { LoginCommand } from './commands/login.command';
import { RefreshTokenCommand } from './commands/refresh-token.command';
import { LogoutCommand } from './commands/logout.command';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiBody({ type: LoginDto })
  async login(@Body() dto: LoginDto) {
    return this.commandBus.execute(
      new LoginCommand(dto.username, dto.password),
    );
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshDto })
  async refresh(@Body() dto: RefreshDto) {
    return this.commandBus.execute(
      new RefreshTokenCommand(dto.refreshToken),
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  @ApiBody({ type: LogoutDto })
  async logout(@Body() dto: LogoutDto) {
    return this.commandBus.execute(
      new LogoutCommand(dto.refreshToken),
    );
  }
}
