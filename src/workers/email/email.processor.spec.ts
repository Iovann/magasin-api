import { Test, TestingModule } from '@nestjs/testing';
import { EmailProcessor } from './email.processor';
import { EmailService } from '../../libs/email/email.service';
import { Logger } from '@nestjs/common';

describe('EmailProcessor', () => {
  let processor: EmailProcessor;
  let emailService: jest.Mocked<EmailService>;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    // Création des mocks
    emailService = {
      sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    } as any;

    logger = {
      log: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    processor = module.get<EmailProcessor>(EmailProcessor);
    // On remplace le logger par notre mock
    (processor as any).logger = logger;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('devrait être défini', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    const mockJob = (data: any) => ({
      id: 'job-123',
      data,
    });

    it('should send a welcome email successfully', async () => {
      const job = mockJob({
        email: 'test@example.com',
        name: 'John Doe',
        role: 'Admin',
        password: 'password123',
      });

      const result = await processor.process(job as any);

      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        'test@example.com',
        'John Doe',
        'Admin',
        'password123',
      );
      expect(logger.log).toHaveBeenCalledWith('Traitement du job commencé: job-123');
      expect(result).toEqual({ success: true, messageId: 'job-123' });
    });

    it('should handle missing optional values', async () => {
      const job = mockJob({
        email: 'test@example.com',
      });

      await processor.process(job as any);

      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        'test@example.com',
        ' ',
        'Vendeur',
        ' ',
      );
    });

    it('should log an error in case of email sending failure', async () => {
      emailService.sendWelcomeEmail.mockResolvedValueOnce(false);
      const job = mockJob({
        email: 'test@example.com',
        name: 'John Doe',
      });

      await expect(processor.process(job as any)).rejects.toThrow(
        'Échec de l\'envoi de l\'email à test@example.com',
      );
    });

    it('should log errors and rethrow', async () => {
      const error = new Error('Erreur réseau');
      emailService.sendWelcomeEmail.mockRejectedValueOnce(error);
      const job = mockJob({
        email: 'test@example.com',
      });

      await expect(processor.process(job as any)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(
        'Erreur lors du traitement du job job-123',
        {
          error: 'Erreur réseau',
          stack: expect.any(String),
          job: { email: 'test@example.com' },
        },
      );
    });
  });
});
