import { Inject, Injectable } from "@nestjs/common";
import * as crypto from "crypto";
import { ConfigService } from "@nestjs/config";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

@Injectable()
export class EncryptionService {
  private readonly algorithm = "aes-256-cbc";
  private readonly key: Buffer;
  private readonly iv: Buffer;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {
    const [secret, iv] = [
      this.configService.getOrThrow<string>("CRYPTO_SECRET"),
      this.configService.getOrThrow<string>("CRYPTO_IV"),
    ];

    this.key = Buffer.from(secret.padEnd(32), "utf-8");
    this.iv = Buffer.from(iv.padEnd(16), "utf-8");
  }

  /**
   * Encrypts a string using AES encryption.
   * Uses a cipher to encrypt the data with the specified algorithm, key, and initialization vector (IV).
   * Returns the encrypted data as a base64 string.
   * Throws an error if encryption fails.
   */
  encrypt(data: string): string {
    try {
      const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
      let encrypted = cipher.update(data, "utf8", "base64");
      encrypted += cipher.final("base64");
      return encrypted;
    } catch (error) {
      this.logger.error(`Encryption failed: ${error.message}`);
      throw new Error("Encryption failed");
    }
  }

  /**
   * Decrypts a base64 encoded string using AES decryption.
   * Uses a deciphering to decrypt the data with the specified algorithm, key, and initialization vector (IV).
   * Returns the decrypted data as a UTF-8 string.
   * Throws an error if decryption fails.
   */
  decrypt(data: string): string {
    try {
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.key,
        this.iv,
      );
      let decrypted = decipher.update(data, "base64", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (error) {
      this.logger.error(`Decryption failed: ${error.message}`);
      throw new Error("Decryption failed");
    }
  }

  /**
   * Generates a random strong password.
   * Uses a random number generator to select characters from a charset.
   * Returns the generated password as a string.
   */
  generateStrongPassword(length: number = 8): string {
    if (length < 8) {
      throw new Error("Password length must be at least 8 characters");
    }

    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789*#?!@$%&";

    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset[randomValues[i] % charset.length];
    }
    return password;
  }
}
