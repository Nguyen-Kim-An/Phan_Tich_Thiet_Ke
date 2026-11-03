import { Body, ConflictException, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IsEmail, IsString, MinLength } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../database.service';

class RegisterDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsString() @MinLength(2) fullName!: string;
}
class LoginDto { @IsEmail() email!: string; @IsString() password!: string; }

@Controller('auth')
export class AuthController {
  constructor(private readonly db: DatabaseService, private readonly jwt: JwtService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const hash = await bcrypt.hash(dto.password, 12);
    try {
      const { rows } = await this.db.query('INSERT INTO users(email,password_hash,full_name) VALUES($1,$2,$3) RETURNING user_id,email,full_name,role', [dto.email.toLowerCase(), hash, dto.fullName]);
      return this.tokens(rows[0]);
    } catch (error: any) {
      if (error?.code === '23505') throw new ConflictException('Email đã được sử dụng');
      throw error;
    }
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const { rows } = await this.db.query('SELECT user_id,email,password_hash,full_name,role FROM users WHERE email=$1', [dto.email.toLowerCase()]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(dto.password, user.password_hash))) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    return this.tokens(user);
  }

  private tokens(user: any) {
    const profile = { userId: user.user_id, email: user.email, fullName: user.full_name, role: user.role };
    return { user: profile, accessToken: this.jwt.sign(profile), refreshToken: this.jwt.sign(profile, { secret: process.env.JWT_REFRESH_SECRET ?? 'development-refresh-secret-change', expiresIn: '30d' }) };
  }
}
