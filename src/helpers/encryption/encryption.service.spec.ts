import { Test, TestingModule } from "@nestjs/testing";
import { EncryptionService } from "./encryption.service";
import { ConfigService } from "@nestjs/config";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

describe("EncryptionService", () => {
  let service: EncryptionService;

  const mockLogger = {
    error: jest.fn(),
  } as unknown as Logger;

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      if (key === "CRYPTO_SECRET") return "12345678901234567890123456789012";
      if (key === "CRYPTO_IV") return "1234567890123456";
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("encrypt and decrypt", () => {
    it("should correctly encrypt and decrypt data", () => {
      const plainText = "HelloWorld";
      const encrypted = service.encrypt(plainText);
      expect(typeof encrypted).toBe("string");
      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(plainText);
    });

    it("should log and throw an error if encryption fails", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const cryptoModule = require("crypto");
      jest.spyOn(cryptoModule, "createCipheriv").mockImplementationOnce(() => {
        throw new Error("Invalid IV length");
      });

      expect(() => service.encrypt("test")).toThrow("Encryption failed");
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Encryption failed"),
      );
    });

    it("should log and throw an error if decryption fails", () => {
      expect(() => service.decrypt("invaliddata")).toThrow("Decryption failed");
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Decryption failed"),
      );
    });
  });

  describe("generateStrongPassword", () => {
    const testCases = [
      { length: 8, expectedLength: 8 },
      { length: 12, expectedLength: 12 },
      { length: 16, expectedLength: 16 },
    ];

    testCases.forEach(({ length, expectedLength }) => {
      it(`should generate a ${expectedLength}-character password when length=${length}`, () => {
        const password = service.generateStrongPassword(length);
        expect(password).toHaveLength(expectedLength);
      });
    });

    it("should throw error for length less than 8", () => {
      expect(() => service.generateStrongPassword(7)).toThrow(
        "Password length must be at least 8 characters",
      );
    });

    it("should only contain characters from the defined charset", () => {
      const charset =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789*#?!@$%&";
      const password = service.generateStrongPassword(10);
      for (const char of password) {
        expect(charset).toContain(char);
      }
    });

    it("should generate different passwords on subsequent calls", () => {
      const password1 = service.generateStrongPassword(10);
      const password2 = service.generateStrongPassword(10);
      expect(password1).not.toBe(password2);
    });
  });
});
