import { Configuration, Value } from "@itgorillaz/configify";
import { IsNotEmpty, IsString, IsPhoneNumber } from "class-validator";

@Configuration()
export class InitUserConfig {
    @Value('ADMIN_FIRSTNAME')
    @IsNotEmpty()
    @IsString()
    adminFirstName: string;

    @Value('ADMIN_LASTNAME')
    @IsNotEmpty()
    @IsString()
    adminLastName: string;

    @Value('ADMIN_EMAIL')
    @IsNotEmpty()
    @IsString()
    adminEmail: string;

    @Value('ADMIN_PASSWORD')
    @IsNotEmpty()
    @IsString()
    adminPassword: string;

    @IsPhoneNumber()
    @Value('ADMIN_PHONENUMBER')
    @IsNotEmpty()
    @IsString()
    adminPhoneNumber: string;

}
    