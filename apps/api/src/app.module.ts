import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseService } from './database.service';
import { AuthController } from './modules/auth.controller';
import { CatalogController } from './modules/catalog.controller';
import { CommerceController } from './modules/commerce.controller';
import { AiController } from './modules/ai.controller';
import { AdminController } from './modules/admin.controller';
import { StylistController } from './modules/stylist.controller';
import { StylistService } from './modules/stylist.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: ['apps/api/.env', '.env'] }), JwtModule.register({ global: true, secret: process.env.JWT_SECRET ?? 'development-secret-change-before-production', signOptions: { expiresIn: '15m' } })],
  controllers: [AuthController, CatalogController, CommerceController, AiController, AdminController, StylistController],
  providers: [DatabaseService, StylistService],
})
export class AppModule {}
