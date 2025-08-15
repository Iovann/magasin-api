import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BcryptService {
  private readonly saltRounds = 10;

  /**
   * Hashes a plain text password.
   * @param password The plain text password to hash.
   * @returns The hashed password.
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compares a plain text password with a hashed password.
   * @param password The plain text password.
   * @param hash The hashed password to compare against.
   * @returns True if the password matches the hash, false otherwise.
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}