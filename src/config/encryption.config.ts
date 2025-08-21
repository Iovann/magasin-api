import { Configuration, Value } from "@itgorillaz/configify";
import { IsNotEmpty, IsString } from "class-validator";

@Configuration()
export class EncryptionConfig {
  @IsNotEmpty({ message: "Crypto encryption secret should not be empty" })
  @IsString({ message: "Crypto encryption secret should be a string" })
  @Value("CRYPTO_SECRET")
  cryptoSecret: string;

  @IsNotEmpty({ message: "Crypto encryption should not be empty" })
  @IsString({ message: "Crypto encryption should be a string" })
  @Value("CRYPTO_IV")
  cryptoIV: string;
}
