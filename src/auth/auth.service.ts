import { Injectable } from "@nestjs/common";
import { UsersService } from "../core/users/services/users.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { User } from "../core/users/entities/user.entity";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (user && (await bcrypt.compare(pass, user.passwordHash!))) {
      const result = { ...user };
      delete result.passwordHash;
      return result;
    }
    return null;
  }

  async login(user: User) {
    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.usersService.setCurrentRefreshToken(
      tokens.refreshToken,
      user.id,
    );
    return tokens;
  }

  async logout(userId: string) {
    return this.usersService.removeRefreshToken(userId);
  }

  async getTokens(userId: string, email: string, role: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          role,
        },
        {
          secret: this.configService.get<string>("JWT_SECRET"),
          expiresIn: this.configService.get<string>("JWT_EXPIRATION_TIME"),
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          role,
        },
        {
          secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
          expiresIn: this.configService.get<string>(
            "JWT_REFRESH_EXPIRATION_TIME",
          ),
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
