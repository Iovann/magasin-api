import { Strategy } from "passport-local";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { AuthService } from "../auth.service";
import { ErrorHandlingService } from "../../common/response/error-handling";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private readonly errorHandlingService: ErrorHandlingService,
  ) {
    super({ usernameField: "email" });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw this.errorHandlingService.returnOnAuthorized(
        "ERR_LOCAL_STRATEGY_001_VALIDATE",
        "Invalid credentials",
      );
    }
    return user;
  }
}
