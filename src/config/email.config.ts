import { Configuration, Value } from "@itgorillaz/configify";
import { IsNotEmpty, IsString } from "class-validator";

@Configuration()
export class EmailConfig {
    @Value('EMAIL_FROM')
    @IsNotEmpty()
    @IsString()
    emailFrom: string;

    @Value('GOOGLE_APP_PASSWORD')
    @IsNotEmpty()
    @IsString()
    googleAppPassword: string;
}