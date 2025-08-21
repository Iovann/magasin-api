import { Configuration, Value } from "@itgorillaz/configify";
import { IsNotEmpty, IsString } from "class-validator";

@Configuration()
export class JwtConfig {
    @Value('JWT_SECRET')
    @IsNotEmpty()
    @IsString()
    secret: string;

    @Value('JWT_EXPIRATION_TIME')
    @IsNotEmpty()
    @IsString()
    expirationTime: string;

    @Value('JWT_REFRESH_EXPIRATION_TIME')
    @IsNotEmpty()
    @IsString()
    refreshExpirationTime: string;

    @Value('JWT_REFRESH_SECRET')
    @IsNotEmpty()
    @IsString()
    refreshSecret: string;
}
