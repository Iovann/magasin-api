import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EmailService } from '../../libs/email/email.service';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<{ 
    email: string;
    name?: string;
    role?: string;
    password?: string; 
  }>) {
    try {
      this.logger.log(`Traitement du job commencé: ${job.id}`);
      const { email, name, role, password } = job.data;
      
      this.logger.debug(`Envoi d'email à ${email}${name ? ` (${name})` : ''}`, {
        jobId: job.id,
        email,
        name : name || ' ',
        role : role || 'Vendeur'
      });

      const isSent = await this.emailService.sendWelcomeEmail(email, name || ' ', role || 'Vendeur', password || ' ');

      if (isSent) {
        this.logger.log(`Email envoyé avec succès à ${email}`, {
          jobId: job.id
        });
        return { success: true, messageId: job.id };
      } else {
        throw new Error(`Échec de l'envoi de l'email à ${email}`);
      }
    } catch (error) {
      this.logger.error(`Erreur lors du traitement du job ${job.id}`, {
        error: error.message,
        stack: error.stack,
        job: job.data
      });
      throw error; // BullMQ va gérer la réessai si configuré
    }
  }
}