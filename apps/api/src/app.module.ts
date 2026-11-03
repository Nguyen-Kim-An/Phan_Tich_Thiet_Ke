import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseService } from './database.service';
import { AuthController } from './modules/auth.controller';
import { CatalogController } from './modules/catalog.controller';
import { CommerceController } from './modules/commerce.controller';
import { AiController } from './modules/ai.controller';
import { AdminController } from './modules/admin.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), JwtModule.register({ global: true, secret: process.env.JWT_SECRET ?? 'development-secret-change-before-production', signOptions: { expiresIn: '15m' } })],
  controllers: [AuthController, CatalogController, CommerceController, AiController, AdminController],
  providers: [DatabaseService],
})
export class AppModule {}
