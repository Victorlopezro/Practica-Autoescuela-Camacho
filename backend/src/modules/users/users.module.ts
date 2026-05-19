import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UsersController } from './users.controller';
import { CreateUserHandler } from './commands/create-user.handler';
import { UpdateUserHandler } from './commands/update-user.handler';
import { DeleteUserHandler } from './commands/delete-user.handler';

const handlers = [CreateUserHandler, UpdateUserHandler, DeleteUserHandler];

@Module({
  imports: [CqrsModule],
  controllers: [UsersController],
  providers: [...handlers],
})
export class UsersModule {}
