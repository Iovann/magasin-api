import { Test, TestingModule } from "@nestjs/testing";
import { EmailService } from "./email.service";
import { ConfigService } from "@nestjs/config";
import { TemplateService } from "./template.service";
import { Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";

// Mock nodemailer
jest.mock("nodemailer", () => {
  const mockSendMail = jest.fn();
  const mockVerify = jest.fn();
  const mockCreateTransport = jest.fn(() => ({
    sendMail: mockSendMail,
    verify: mockVerify,
  }));

  return {
    createTransport: mockCreateTransport,
    __mockSendMail: mockSendMail,
    __mockVerify: mockVerify,
  };
});

describe("EmailService", () => {
  let service: EmailService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let configService: ConfigService;
  let templateService: TemplateService;
  let mockLogger: any;

  const mockEmailFrom = "test@example.com";
  const mockGoogleAppPassword = "mock-password";

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock ConfigService
    const mockConfigService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case "EMAIL_FROM":
            return mockEmailFrom;
          case "GOOGLE_APP_PASSWORD":
            return mockGoogleAppPassword;
          default:
            return null;
        }
      }),
    };

    // Mock TemplateService
    const mockTemplateService = {
      render: jest.fn().mockResolvedValue("<p>Test template</p>"),
    };

    // Mock Logger
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: TemplateService, useValue: mockTemplateService },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
    templateService = module.get<TemplateService>(TemplateService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("sendMail", () => {
    const to = "recipient@example.com";
    const subject = "Test Subject";
    const html = "<p>Test email</p>";

    it("should send email with correct parameters", async () => {
      // Mock successful email send
      const mockSendMail = (nodemailer.createTransport() as any).sendMail;
      mockSendMail.mockResolvedValueOnce({ messageId: "test-message-id" });

      const result = await service.sendMail(to, subject, html);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: `"MagasinX" <${mockEmailFrom}>`,
        to,
        subject,
        html,
      });
      expect(result).toBe(true);
    });
  });

  describe("sendWelcomeEmail", () => {
    const email = "newuser@example.com";
    const name = "Test User";
    const role = "USER";
    const password = "test-password";

    it("should send welcome email with correct template", async () => {
      const mockSendMail = (nodemailer.createTransport() as any).sendMail;
      mockSendMail.mockResolvedValueOnce({ messageId: "test-message-id" });

      const result = await service.sendWelcomeEmail(
        email,
        name,
        role,
        password,
      );

      expect(templateService.render).toHaveBeenCalledWith("welcome", {
        name,
        email,
        role,
        password,
        currentYear: expect.any(Number),
      });
      expect(mockSendMail).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });
});
