import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  /**
   * Validate the JWT payload
   * @param payload The JWT payload
   * @returns The authenticated user
   */
  async validate(payload: any) {
    const user = await this.authService.findById(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    
    return { userId: payload.sub, email: payload.email };
  }
} 