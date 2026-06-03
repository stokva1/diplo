import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [InvitationsController],
  providers: [InvitationsService],
})
export class InvitationsModule {}